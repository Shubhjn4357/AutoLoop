import { Hono } from 'hono';
import { db, socialAccounts, eq } from '@autoloop/db';
import { 
  fetchIGMedia, 
  fetchIGStories, 
  fetchIGInsights, 
  searchIGUser, 
  fuzzySearchIGUsers, 
  publishIGPost,
  fetchIGProfile
} from '@autoloop/shared';

export const instagramRouter = new Hono();

// Helper to get connected account
const getAccount = async (userId: string) => {
  return db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, userId),
  });
};

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
