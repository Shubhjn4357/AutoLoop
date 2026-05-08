import { Hono } from 'hono';
import { db, contacts, contactTags, eq, desc } from '@autoloop/db';

export const contactsRouter = new Hono();

contactsRouter.get('/list', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const limit = parseInt(c.req.query('limit') ?? '50', 10);

  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: [desc(contacts.lastSeenAt)],
    limit,
  });

  return c.json({ contacts: userContacts });
});

contactsRouter.post('/tags', async (c) => {
  const { contactId, tag, userId } = await c.req.json();
  if (!contactId || !tag || !userId) return c.json({ error: 'Missing params' }, 400);

  try {
    await db.insert(contactTags).values({
      id: crypto.randomUUID(),
      contactId,
      tag,
      createdAt: new Date(),
    });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
