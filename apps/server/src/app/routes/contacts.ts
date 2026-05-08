import { Hono } from 'hono';
import { db, contacts, contactTags, socialAccounts, eq, desc, and } from '@autoloop/db';

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
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
    });
    if (!contact) return c.json({ error: 'Contact not found' }, 404);

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

contactsRouter.delete('/tags', async (c) => {
  const { contactId, tag, userId } = await c.req.json();
  if (!contactId || !tag || !userId) return c.json({ error: 'Missing params' }, 400);

  try {
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
    });
    if (!contact) return c.json({ error: 'Contact not found' }, 404);

    await db
      .delete(contactTags)
      .where(and(eq(contactTags.contactId, contactId), eq(contactTags.tag, tag)));

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

contactsRouter.post('/import', async (c) => {
  const { users, userId } = await c.req.json();
  if (!Array.isArray(users) || !userId) return c.json({ error: 'Missing params' }, 400);

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, userId),
  });
  if (!account?.externalId) return c.json({ error: 'No Instagram account connected' }, 404);

  const imported = [];

  try {
    for (const user of users.slice(0, 100)) {
      if (!user?.id) continue;

      const existing = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.userId, userId),
          eq(contacts.externalId, account.externalId),
          eq(contacts.senderId, user.id)
        ),
      });

      if (existing) {
        const [updated] = await db
          .update(contacts)
          .set({
            username: user.username ?? existing.username,
            name: user.name ?? existing.name,
            profilePic: user.profile_picture_url ?? existing.profilePic,
            lastSeenAt: new Date(),
          })
          .where(eq(contacts.id, existing.id))
          .returning();
        imported.push({ ...updated, tags: [] });
        continue;
      }

      const [created] = await db
        .insert(contacts)
        .values({
          id: crypto.randomUUID(),
          userId,
          externalId: account.externalId,
          senderId: user.id,
          username: user.username ?? null,
          name: user.name ?? null,
          profilePic: user.profile_picture_url ?? null,
          status: 'automated',
        })
        .returning();
      imported.push({ ...created, tags: [] });
    }

    return c.json({ imported });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
