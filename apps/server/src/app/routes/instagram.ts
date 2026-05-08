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

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

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
    console.log("[IG Callback] Starting token exchange...");
    console.log("[IG Callback] App ID:", appId ? "SET" : "MISSING");
    console.log("[IG Callback] App Secret:", appSecret ? "SET" : "MISSING");
    console.log("[IG Callback] Redirect URI:", redirectUri);

    // TEST CONNECTIVITY
    console.log("[IG Callback] Testing general outbound connectivity (Google)...");
    try {
      const test = await fetch("https://www.google.com", { signal: AbortSignal.timeout(3000) });
      console.log("[IG Callback] Google Test Status:", test.status);
    } catch (e: any) {
      console.error("[IG Callback] Google Test Failed:", e.message);
    }

    // 1. Exchange code for short-lived token
    const tokenUrl = `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    console.log("[IG Callback] Fetching short-lived token...");
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error("[IG Callback] Facebook Token Error:", tokenData.error);
      throw new Error(tokenData.error.message);
    }
    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token
    console.log("[IG Callback] Exchanging for long-lived token...");
    const longTokenUrl = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
    
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token;

    // 3. Get Pages & IG Business Account
    console.log("[IG Callback] Fetching linked pages...");
    const pagesRes = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${accessToken}&fields=instagram_business_account,name`);
    const pagesData = await pagesRes.json();
    
    console.log("[IG Callback] Pages found:", JSON.stringify(pagesData.data?.map((p: any) => ({ name: p.name, hasIG: !!p.instagram_business_account }))));

    const pageWithIG = pagesData.data?.find((p: any) => p.instagram_business_account);

    if (!pageWithIG) {
      console.error("[IG Callback] No Instagram Business Account linked to any found Facebook Pages.");
      return c.redirect(`${webUrl}/dashboard/settings?error=no_instagram_found`);
    }

    const igId = pageWithIG.instagram_business_account.id;
    const igProfile = await fetchIGProfile(igId, accessToken);

    // 4. Upsert into database
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
    if (err.cause) console.error("[IG Callback] Error Cause:", err.cause);
    if (err.stack) console.error("[IG Callback] Stack Trace:", err.stack);
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
