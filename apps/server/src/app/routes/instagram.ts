import { Hono } from 'hono';
import { db, socialAccounts, eq, and } from '@autoloop/db';
import crypto from 'crypto';
import { 
  fetchIGMedia, 
  fetchIGStories, 
  fetchIGInsights, 
  searchIGUser, 
  fuzzySearchIGUsers, 
  publishIGPost,
  fetchIGProfile
} from '@autoloop/shared';

const GRAPH_VERSION = "v21.0"; // Hardcoded for stability
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function fetchWithRetry(url: string, options: any = {}, retries = 5, backoff = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Fetch Attempt ${i + 1}] Calling: ${url.split('?')[0]}...`);
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      if (res.ok) return res;
      
      const errorText = await res.text().catch(() => "No error body");
      console.warn(`[Fetch Retry] Status ${res.status}: ${errorText.substring(0, 100)}`);
      
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
        continue;
      }
      return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`[Fetch Retry] Network Error: ${err.message}. Retrying...`);
      await new Promise(r => setTimeout(r, backoff * (i + 1)));
    }
  }
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
  const userId = c.req.query('userId');
  if (!userId) return c.text('Missing userId', 400);

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const serverUrl = process.env.SERVER_BASE_URL || "https://shubhjn-autoloop.hf.space";
  const redirectUri = `${serverUrl}/api/instagram/callback`;
  
  const scopes = [
    "instagram_basic",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_read_engagement"
  ].join(",");

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${userId}`;

  return c.redirect(authUrl);
});

instagramRouter.get('/callback', async (c) => {
  const code = c.req.query('code');
  const userId = c.req.query('state');
  const error = c.req.query('error');

  const webUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !userId) {
    return c.redirect(`${webUrl}/dashboard/settings?error=instagram_auth_failed`);
  }

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  const serverUrl = process.env.SERVER_BASE_URL || "https://shubhjn-autoloop.hf.space";
  const redirectUri = `${serverUrl}/api/instagram/callback`;

  try {
    // 1. Exchange code for short-lived token
    const tokenUrl = `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetchWithRetry(tokenUrl);
    const tokenData = await tokenRes!.json();
    
    if (tokenData.error) throw new Error(tokenData.error.message);
    const shortToken = tokenData.access_token;

    await new Promise(r => setTimeout(r, 500));

    // 2. Exchange for long-lived token
    const longTokenUrl = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
    const longTokenRes = await fetchWithRetry(longTokenUrl);
    const longTokenData = await longTokenRes!.json();
    const accessToken = longTokenData.access_token;

    await new Promise(r => setTimeout(r, 500));

    // 3. Get Pages & IG Business Account
    const pagesRes = await fetchWithRetry(`${GRAPH_BASE}/me/accounts?access_token=${accessToken}&fields=instagram_business_account,name,access_token`);
    const pagesData = await pagesRes!.json();
    const pageWithIG = pagesData.data?.find((p: any) => p.instagram_business_account);

    if (!pageWithIG) {
      return c.redirect(`${webUrl}/dashboard/settings?error=no_instagram_found`);
    }

    const igId = pageWithIG.instagram_business_account.id;
    const pageId = pageWithIG.id;
    const pageAccessToken = pageWithIG.access_token; // Pages API gives us a Page Access Token
    const igProfile = await fetchIGProfile(igId, accessToken);

    // 4. Subscribe the Page to our App's Webhooks
    try {
      const subUrl = `${GRAPH_BASE}/${pageId}/subscribed_apps`;
      console.log("[IG Callback] Subscribing Page to Webhooks:", pageId);
      const subRes = await fetch(subUrl, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: "messages,messaging_postbacks,messaging_optins,feed,mention",
          access_token: pageAccessToken
        })
      });
      const subData = await subRes.json();
      console.log("[IG Callback] Webhook subscription result:", subData);
    } catch (err) {
      console.error("[IG Callback] Webhook subscription ERROR:", err);
    }

    // 5. Upsert into database
    const existing = await db.query.socialAccounts.findFirst({
      where: and(eq(socialAccounts.userId, userId), eq(socialAccounts.externalId, igId)),
    });

    if (existing) {
      await db.update(socialAccounts).set({
        accessToken,
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
        accessToken,
        instagramUsername: igProfile.username,
        instagramProfilePicture: igProfile.profile_picture_url,
      });
    }

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
    const users = await fuzzySearchIGUsers(account.externalId, account.accessToken, q);
    return c.json({ data: users });
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
