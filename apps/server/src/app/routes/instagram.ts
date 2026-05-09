import { Hono } from 'hono';
import { db, socialAccounts, eq, and } from '@autoloop/db';
import crypto from 'crypto';
import { redisConnection } from '../../config/redis';
import { 
  fetchIGMedia, 
  fetchIGStories, 
  fetchIGInsights, 
  searchIGUser, 
  fuzzySearchIGUsers, 
  publishIGPost,
  fetchIGProfile,
  fetchWithRetry
} from '@autoloop/shared';
import { emitToUser } from '../../lib/socket';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const STATE_TTL_MS = 60 * 60 * 1000;

function getStateSecret() {
  return process.env.SERVER_API_KEY || process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
}

function verifySignedState(state: string | undefined) {
  const stateSecret = getStateSecret();
  if (!state || !stateSecret) return null;

  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", stateSecret)
    .update(payload)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  let parsed: { userId?: string; ts?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (!parsed.userId || !parsed.ts || Date.now() - parsed.ts > STATE_TTL_MS) {
    return null;
  }

  return parsed.userId;
}

function isSubscriptionSuccess(body: any) {
  return Boolean(body?.success) && !body?.error;
}

async function postSubscription(
  label: string,
  url: string,
  accessToken: string,
  fields: string
) {
  // Use both 'fields' and 'subscribed_fields' to cover both Page and Instagram object requirements.
  // Meta often prefers these as query parameters even in POST requests.
  const targetUrl = new URL(url);
  targetUrl.searchParams.set("subscribed_fields", fields);
  targetUrl.searchParams.set("fields", fields);
  targetUrl.searchParams.set("access_token", accessToken);

  const res = await fetchWithRetry(targetUrl.toString(), {
    method: "POST"
  });
  
  if (!res) throw new Error(`Fetch failed for ${label}`);
  const ok = !res.error;

  console.log(
    `[IG Callback] Webhook subscription ${label}: ok=${ok} fields=${fields} body=${JSON.stringify(res)}`
  );

  return { label, ok, fields, body: res };
}

async function getSubscriptionStatus(label: string, url: string, accessToken: string) {
  const statusUrl = new URL(url);
  statusUrl.searchParams.set("access_token", accessToken);

  const res = await fetchWithRetry(statusUrl.toString());
  if (!res) throw new Error(`Fetch failed for status ${label}`);

  console.log(
    `[IG Callback] Webhook subscription status ${label}: body=${JSON.stringify(res)}`
  );

  return { label, body: res };
}

async function subscribeToWebhooks(userId: string, params: {
  igId: string;
  pageId: string;
  userAccessToken: string;
  pageAccessToken: string;
}) {
  const attempts = [];
  // For Instagram Business Messaging, we primarily subscribe the PAGE.
  // Direct Instagram Account subscription often fails with "Capability" errors and is usually redundant.
  emitToUser(userId, 'instagram:connecting', { step: 'webhooks', message: 'Configuring Meta Webhooks...' });

  const pageSubscriptionUrl = `${GRAPH_BASE}/${params.pageId}/subscribed_apps`;
  const pageFields = "messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,message_edits,message_reactions,instagram_manage_comments,feed,mentions,story_insights";

  // Retry Page subscription up to 3 times due to network instability
  for (let i = 0; i < 3; i++) {
    try {
      const res = await postSubscription(
        "page/all-fields",
        pageSubscriptionUrl,
        params.pageAccessToken,
        pageFields
      );
      attempts.push(res);
      if (res.ok) break;
    } catch (error) {
      console.error(`[IG Callback] Page subscription attempt ${i + 1} failed:`, error);
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }

  // We already included 'feed' in the Page subscription above.

  await Promise.allSettled([
    getSubscriptionStatus("page", pageSubscriptionUrl, params.pageAccessToken),
    // Also try to subscribe the Instagram ID directly for Mentions/Insights
    (async () => {
       const igSubscriptionUrl = `${GRAPH_BASE}/${params.igId}/subscribed_apps`;
       // Explicitly include all fields needed for Instagram Business Account webhooks
       const igFields = "comments,mentions,insights,story_insights";
       try {
         const res = await postSubscription("ig/direct", igSubscriptionUrl, params.userAccessToken, igFields);
         attempts.push(res);
       } catch (igErr: any) {
         console.warn(`[IG Callback] IG-level subscription failed: ${igErr.message}`);
       }
    })()
  ]);

  const summary = attempts.map(a => `${a.label}: ${a.ok ? "SUCCESS" : "FAILED"}`).join(", ");
  console.log(`[IG Callback] Webhook Subscription Summary: ${summary}`);

  if (!attempts.some((attempt) => attempt.ok)) {
    console.warn(
      "[IG Callback] CRITICAL: No webhook subscription attempt succeeded. Check permissions and Meta App setup."
    );
  } else {
    console.log("[IG Callback] Webhook setup verified. System is ready to receive events.");
  }

  return attempts;
}

export const instagramRouter = new Hono();

// Helper to get connected account
const getAccount = async (userId: string) => {
  return db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, userId),
  });
};

// --- OAuth Flow ---

instagramRouter.get('/connect', async (c) => {
  const state = c.req.query('state');
  const userId = verifySignedState(state) ?? (
    process.env.NODE_ENV !== "production" ? c.req.query('userId') : undefined
  );
  if (!userId) return c.text('Invalid connection state', 400);

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  if (!appId) return c.text('Meta app ID is not configured', 500);

  const serverUrl = process.env.SERVER_BASE_URL || "https://shubhjn-autoloop.hf.space";
  const redirectUri = `${serverUrl}/api/instagram/callback`;
  
  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_messaging",
    "pages_manage_engagement",
    "pages_manage_metadata",
    "pages_read_engagement",
    "instagram_manage_engagement",
    "instagram_manage_contents",
    "business_management",
    "public_profile"
  ].join(",");

  const oauthState = state ?? userId;
  const authUrl = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${encodeURIComponent(oauthState)}`;

  console.log("[IG Connect] Redirecting to:", authUrl);
  return c.redirect(authUrl);
});

instagramRouter.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const userId = verifySignedState(state) ?? (
    process.env.NODE_ENV !== "production" ? state : undefined
  );
  const error = c.req.query('error');

  const webUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !userId) {
    return c.redirect(`${webUrl}/dashboard/settings?error=instagram_auth_failed`);
  }

  // 0. Redis Lock to prevent duplicate processing
  const lockKey = `ig_callback_lock:${code}`;
  const isLocked = await redisConnection.set(lockKey, "1", "EX", 60, "NX");
  if (!isLocked) {
    console.log(`[IG Callback] Duplicate request for code detected, skipping lock acquisition.`);
    return c.text("Processing request...", 202);
  }

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  if (!appId || !appSecret) {
    return c.redirect(`${webUrl}/dashboard/settings?error=meta_app_not_configured`);
  }
  const serverUrl = process.env.SERVER_BASE_URL || "https://shubhjn-autoloop.hf.space";
  const redirectUri = `${serverUrl}/api/instagram/callback`;

  try {
    // 1. Exchange code for short-lived token
    const tokenUrl = `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenData = await fetchWithRetry(tokenUrl);
    const shortToken = tokenData.access_token;

    await new Promise(r => setTimeout(r, 500));

    // 2. Exchange for long-lived token
    const longTokenUrl = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
    const longTokenData = await fetchWithRetry(longTokenUrl);
    const accessToken = longTokenData.access_token;
    if (!accessToken) throw new Error("Meta did not return a long-lived access token");

    await new Promise(r => setTimeout(r, 500));

    // 3. Get Pages & IG Business Account
    emitToUser(userId, 'instagram:connecting', { step: 'pages', message: 'Fetching your Instagram pages...' });
    const pagesData = await fetchWithRetry(`${GRAPH_BASE}/me/accounts?access_token=${accessToken}&fields=instagram_business_account,name,access_token`);
    if (pagesData.error) throw new Error(pagesData.error.message);
    const pageWithIG = pagesData.data?.find((p: any) => p.instagram_business_account);

    if (!pageWithIG) {
      return c.redirect(`${webUrl}/dashboard/settings?error=no_instagram_found`);
    }

    const igId = pageWithIG.instagram_business_account.id;
    const pageId = pageWithIG.id;
    const pageAccessToken = pageWithIG.access_token; // Pages API gives us a Page Access Token
    const accountAccessToken = pageAccessToken || accessToken;
    
    // 3.5 Fetch Profile with retries
    emitToUser(userId, 'instagram:connecting', { step: 'profile', message: 'Retrieving profile data...' });
    let igProfile: any;
    try {
      igProfile = await fetchIGProfile(igId, accountAccessToken);
    } catch (err: any) {
      console.warn("[IG Callback] Profile fetch failed, retrying once...", err.message);
      await new Promise(r => setTimeout(r, 2000));
      igProfile = await fetchIGProfile(igId, accountAccessToken);
    }

    // 4. Subscribe the IG/Page account to our app's webhooks.
    await subscribeToWebhooks(userId, {
      igId,
      pageId,
      userAccessToken: accessToken,
      pageAccessToken,
    });

    // 5. Upsert into database
    const existing = await db.query.socialAccounts.findFirst({
      where: and(eq(socialAccounts.userId, userId), eq(socialAccounts.externalId, igId)),
    });

    if (existing) {
      await db.update(socialAccounts).set({
        accessToken: accountAccessToken,
        pageId,
        instagramUsername: igProfile.username,
        instagramProfilePicture: igProfile.profile_picture_url,
        updatedAt: new Date(),
      }).where(eq(socialAccounts.id, existing.id));
    } else {
      await db.insert(socialAccounts).values({
        id: crypto.randomUUID(),
        userId,
        platform: "instagram",
        externalId: igId,
        pageId,
        accessToken: accountAccessToken,
        instagramUsername: igProfile.username,
        instagramProfilePicture: igProfile.profile_picture_url,
      });
    }

    emitToUser(userId, 'instagram:connecting', { step: 'done', message: 'Success! Your account is ready.' });

    return c.redirect(`${webUrl}/dashboard/settings?success=instagram_connected`);
  } catch (err: any) {
    console.error("[IG Callback] Fatal Error:", err.message);
    return c.redirect(`${webUrl}/dashboard/settings?error=server_error`);
  }
});

// --- Existing Routes ---

instagramRouter.get('/profile', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const profile = await fetchIGProfile(account.externalId, account.accessToken);
    return c.json({ data: profile });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.get('/subscription-status', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) {
    return c.json({ error: 'Not connected' }, 404);
  }

  const checks: Record<string, unknown> = {};

  if (account.pageId) {
    checks.page = await getSubscriptionStatus(
      "page",
      `${GRAPH_BASE}/${account.pageId}/subscribed_apps`,
      account.accessToken
    );
  }

  checks.instagram = await getSubscriptionStatus(
    "instagram-account",
    `${GRAPH_BASE}/${account.externalId}/subscribed_apps`,
    account.accessToken
  );

  return c.json({
    graphVersion: GRAPH_VERSION,
    externalId: account.externalId,
    pageId: account.pageId,
    checks,
  });
});

instagramRouter.get('/media', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const media = await fetchIGMedia(account.externalId, account.accessToken);
    return c.json({ data: media });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.get('/stories', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const stories = await fetchIGStories(account.externalId, account.accessToken);
    return c.json({ data: stories });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.get('/insights', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const insights = await fetchIGInsights(account.externalId, account.accessToken);
    return c.json({ data: insights });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.get('/search', async (c) => {
  const userId = c.req.query('userId');
  const q = c.req.query('q');
  if (!userId || !q) return c.json({ error: 'Missing params' }, 400);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const user = await searchIGUser(account.externalId, account.accessToken, q);
    return c.json({ data: user });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.get('/search-fuzzy', async (c) => {
  const userId = c.req.query('userId');
  const q = c.req.query('q');
  if (!userId || !q) return c.json({ error: 'Missing params' }, 400);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const [exactMatch, fuzzyMatches] = await Promise.all([
      searchIGUser(account.externalId, account.accessToken, q).catch(() => null),
      fuzzySearchIGUsers(account.externalId, account.accessToken, q),
    ]);

    return c.json({ exactMatch, fuzzyMatches, query: q });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.post('/publish', async (c) => {
  const { userId, imageUrl, caption } = await c.req.json();
  if (!userId || !imageUrl) return c.json({ error: 'Missing params' }, 400);
  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);
  
  try {
    const res = await publishIGPost(account.externalId, account.accessToken, imageUrl, caption);
    return c.json({ success: true, postId: res.id });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.post('/disconnect', async (c) => {
  const { userId, accountId } = await c.req.json();
  if (!userId || !accountId) return c.json({ error: 'Missing params' }, 400);

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.id, accountId),
  });

  if (!account || account.userId !== userId) {
    return c.json({ error: 'Not found' }, 404);
  }

  try {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, accountId));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

instagramRouter.post('/find-users', async (c) => {
  const { userId, usernames } = await c.req.json();
  if (!userId || !Array.isArray(usernames)) return c.json({ error: 'Missing params' }, 400);

  const account = await getAccount(userId);
  if (!account?.externalId || !account?.accessToken) return c.json({ error: 'Not connected' }, 404);

  const results = [];
  const errors = [];

  for (const username of usernames.slice(0, 50)) {
    try {
      const cleanUsername = username.replace('@', '').trim().toLowerCase();
      if (!cleanUsername) continue;

      const userData = await searchIGUser(account.externalId, account.accessToken, cleanUsername);
      results.push({ username: cleanUsername, found: true, data: userData });
    } catch (err: any) {
      errors.push({ username, error: err.message });
    }
  }

  return c.json({ results, errors, total: results.length });
});
