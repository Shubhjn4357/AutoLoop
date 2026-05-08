import { Hono } from 'hono';
import { instagramWebhookHandler } from './instagram';
export const webhookRouter = new Hono();
// Instagram Webhook
webhookRouter.get('/instagram', instagramWebhookHandler.verify);
webhookRouter.post('/instagram', instagramWebhookHandler.handle);
// TikTok Webhook
webhookRouter.post('/tiktok', async (c) => {
    try {
        const body = await c.req.json();
        console.log('[TikTok Webhook] Received:', body);
        // Add to queue if needed, or process directly
        // For now just acknowledge
        return c.text('OK', 200);
    }
    catch (error) {
        console.error('TikTok Webhook Error:', error);
        return c.text('Error', 500);
    }
});
// Stripe Webhook (Placeholder)
webhookRouter.post('/stripe', async (c) => {
    try {
        const body = await c.req.json();
        console.log('[Stripe Webhook] Received:', body);
        return c.text('OK', 200);
    }
    catch (error) {
        return c.text('Error', 500);
    }
});
