import { Context } from 'hono';
import crypto from 'crypto';

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

      // Acknowledge immediately to avoid Meta retries
      await incomingQueue.add('webhook-event', body, {
        removeOnComplete: true,
        attempts: 1,
      });

      return c.text('EVENT_RECEIVED', 200);
    } catch (error: any) {
      console.error('[Instagram Webhook] Processing Error:', error.message);
      return c.text('Error', 500);
    }
  }
};
