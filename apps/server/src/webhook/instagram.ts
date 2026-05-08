import { Context } from 'hono';
import { incomingQueue } from '../queue';

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
      console.log('[Instagram Webhook] Raw body:', rawBody.substring(0, 200));
      
      const body = JSON.parse(rawBody);

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
