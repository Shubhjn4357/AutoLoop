import { Context } from 'hono';
import crypto from 'crypto';
import { emitToUser } from '../lib/socket';

function isValidMetaSignature(rawBody: string, signatureHeader?: string) {
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  if (!appSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  if (!signatureHeader?.startsWith('sha256=')) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export const instagramWebhookHandler = {
  // Verify webhook with Meta
  async verify(c: Context) {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log('[Instagram Webhook] Verified');
        return c.text(challenge || '');
      }
    }
    return c.text('Forbidden', 403);
  },

  // Handle incoming events
  async handle(c: Context) {
    console.log('[Instagram Webhook] Incoming POST request...');
    try {
      const rawBody = await c.req.text();
      if (!isValidMetaSignature(rawBody, c.req.header('x-hub-signature-256'))) {
        console.warn('[Instagram Webhook] Invalid signature');
        return c.text('Forbidden', 403);
      }

      console.log('[Instagram Webhook] Raw body:', rawBody.substring(0, 200));
      
      const body = JSON.parse(rawBody);
      const { incomingQueue } = await import('../queue');
      const { TriggerType } = await import('@autoloop/types');

      // Event Normalizer
      const entries = body.entry || [];
      const internalEvents: any[] = [];

      for (const entry of entries) {
        const accountId = entry.id;
        const changes = entry.changes || [];
        const messaging = entry.messaging || [];

        // Handle Comments/Mentions (Changes)
        for (const change of changes) {
          const { field, value } = change;
          if (field === 'comments') {
            internalEvents.push({
              eventId: value.id,
              platform: 'instagram',
              triggerType: TriggerType.COMMENT,
              accountId,
              userId: value.from.id,
              username: value.from.username,
              message: value.text,
              commentId: value.id,
              mediaId: value.media?.id,
              timestamp: value.timestamp,
              rawPayload: value,
            });
          }
          } else if (field === 'mentions') {
            internalEvents.push({
              eventId: value.media_id || value.comment_id || `mention-${Date.now()}`,
              platform: 'instagram',
              triggerType: TriggerType.MENTION,
              accountId,
              userId: value.from?.id,
              username: value.from?.username || '',
              message: value.text || 'Mentioned you',
              mediaId: value.media_id,
              commentId: value.comment_id,
              timestamp: value.timestamp || Math.floor(Date.now() / 1000),
              rawPayload: value,
            });
          }
        }

        // Handle DMs (Messaging)
        for (const msg of messaging) {
          const senderId = msg.sender?.id;
          const recipientId = msg.recipient?.id;
          const timestamp = msg.timestamp;
          
          if (msg.message) {
            const isStoryReply = !!msg.message.reply_to?.story;
            internalEvents.push({
              eventId: msg.message.mid,
              platform: 'instagram',
              triggerType: isStoryReply ? TriggerType.STORY_REPLY : TriggerType.DM,
              accountId: recipientId, // The bot's ID
              userId: senderId,
              username: '', // Username not always in raw DM payload
              message: msg.message.text,
              timestamp,
              rawPayload: msg,
            });
          }
        }
      }

      // Dispatch normalized events to queue
      for (const event of internalEvents) {
        await incomingQueue.add('webhook-event', event, {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });

        // 2. Real-time update to dashboard
        const { db, socialAccounts, eq } = await import('@autoloop/db');
        const account = await db.query.socialAccounts.findFirst({
          where: eq(socialAccounts.externalId, event.accountId || "")
        });
        if (account) {
          emitToUser(account.userId, 'instagram:event', event);
        }
      }

      return c.text('EVENT_RECEIVED', 200);
    } catch (error: any) {
      console.error('[Instagram Webhook] Processing Error:', error.message);
      return c.text('Error', 500);
    }
  }
};
