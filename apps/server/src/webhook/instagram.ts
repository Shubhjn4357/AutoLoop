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
    try {
      const body = await c.req.json();
      console.log('[Instagram Webhook] Event received');

      // Acknowledge immediately to avoid Meta retries
      // We push the processing to the queue
      await incomingQueue.add('webhook-event', body, {
        removeOnComplete: true,
        attempts: 1, // Webhook acknowledged, engine handles internal retries
      });

      return c.text('EVENT_RECEIVED', 200);
    } catch (error) {
      console.error('[Instagram Webhook] Error:', error);
      return c.text('Error', 500);
    }
  }
};
