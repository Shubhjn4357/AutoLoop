import { Hono } from 'hono';
import { db, contacts, socialAccounts, scheduledMessages, contactTags, eq, and, inArray } from '@autoloop/db';
import { createNotificationLog } from '@autoloop/shared';

export const broadcastRouter = new Hono();

broadcastRouter.post('/', async (c) => {
  try {
    const { messageText, tag, senderIds, userId } = await c.req.json();

    if (!messageText?.trim() || !userId) {
      return c.json({ error: 'messageText and userId are required' }, 400);
    }

    const account = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.userId, userId),
    });

    if (!account?.externalId || !account?.accessToken) {
      return c.json({ error: 'No Instagram account connected' }, 404);
    }

    let targetContacts: any[] = [];

    if (senderIds && senderIds.length > 0) {
      targetContacts = await db.query.contacts.findMany({
        where: and(
          eq(contacts.userId, userId),
          eq(contacts.externalId, account.externalId),
          inArray(contacts.senderId, senderIds)
        ),
      });
    } else if (tag) {
      const tagged = await db.query.contactTags.findMany({
        where: eq(contactTags.tag, tag),
      });
      const contactIds = tagged.map((t) => t.contactId);
      if (contactIds.length > 0) {
        targetContacts = await db.query.contacts.findMany({
          where: and(
            eq(contacts.userId, userId),
            eq(contacts.externalId, account.externalId),
            inArray(contacts.id, contactIds)
          ),
        });
      }
    } else {
      return c.json({ error: 'Provide tag or senderIds' }, 400);
    }

    const now = Date.now();
    const staggerMs = 2000;

    for (let i = 0; i < targetContacts.length; i++) {
      const contact = targetContacts[i];
      await db.insert(scheduledMessages).values({
        id: crypto.randomUUID(),
        userId: userId,
        externalId: account.externalId,
        recipientId: contact.senderId,
        messageText: messageText.trim(),
        status: 'pending',
        attempts: 0,
        dueAt: new Date(now + i * staggerMs),
      });
    }

    await createNotificationLog({
      userId: userId,
      type: 'broadcast.scheduled',
      title: 'Broadcast scheduled',
      message: `${targetContacts.length} messages queued for broadcast.`,
      status: 'success',
      metadata: { count: targetContacts.length, tag, senderIds },
    });

    return c.json({
      success: true,
      queued: targetContacts.length,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
