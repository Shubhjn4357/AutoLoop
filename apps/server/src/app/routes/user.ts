import { Hono } from 'hono';
import { db, users, accounts, sessions, socialAccounts, automations, messages, notificationLogs, scheduledMessages, eq } from '@autoloop/db';

export const userRouter = new Hono();

userRouter.post('/delete', async (c) => {
  try {
    const body = await c.req.formData();
    const signedRequest = body.get('signed_request') as string;

    if (!signedRequest) {
      return c.json({ error: 'Missing signed_request' }, 400);
    }

    const [, payload] = signedRequest.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    const facebookUserId = decoded.user_id as string;

    if (!facebookUserId) {
      return c.json({ error: 'Invalid signed_request' }, 400);
    }

    const linkedAccount = await db.query.accounts.findFirst({
      where: eq(accounts.providerAccountId, facebookUserId),
    });

    if (linkedAccount) {
      const userId = linkedAccount.userId;

      await db.delete(socialAccounts).where(eq(socialAccounts.userId, userId));
      await db.delete(automations).where(eq(automations.userId, userId));
      await db.delete(messages).where(eq(messages.userId, userId));
      await db.delete(notificationLogs).where(eq(notificationLogs.userId, userId));
      await db.delete(scheduledMessages).where(eq(scheduledMessages.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }

    const confirmationCode = `autoloop_del_${facebookUserId}_${Date.now()}`;
    const statusUrl = `${process.env.SERVER_BASE_URL || 'https://shubhjn-autoloop.hf.space'}/user/delete?code=${confirmationCode}`;

    return c.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
