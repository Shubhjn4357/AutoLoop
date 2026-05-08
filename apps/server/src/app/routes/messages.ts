import { Hono } from 'hono';
import { db, socialAccounts, messages, eq } from '@autoloop/db';
import { sendInstagramMessage, createNotificationLog } from '@autoloop/shared';

export const messagesRouter = new Hono();

messagesRouter.post('/send', async (c) => {
  try {
    const { recipientId, text, userId } = await c.req.json();

    if (!recipientId || !text?.trim() || !userId) {
      return c.json({ error: 'recipientId, text and userId are required' }, 400);
    }

    const account = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.userId, userId),
    });

    if (!account?.externalId || !account?.accessToken) {
      return c.json({ error: 'No Instagram account connected' }, 404);
    }

    await sendInstagramMessage(account.externalId, recipientId, text.trim(), account.accessToken);

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      userId: userId,
      externalId: account.externalId,
      senderId: recipientId,
      direction: 'outbound',
      status: 'sent',
      text: text.trim(),
      timestamp: new Date(),
    });

    await createNotificationLog({
      userId: userId,
      type: 'message.sent',
      title: 'Manual message sent',
      message: `Sent to ${recipientId}`,
      status: 'success',
      metadata: { recipientId, text: text.trim() },
    });

    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/messages/send]', msg);
    return c.json({ error: msg }, 500);
  }
});
