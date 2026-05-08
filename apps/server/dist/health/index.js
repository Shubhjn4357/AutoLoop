import { Hono } from 'hono';
export const healthRouter = new Hono();
healthRouter.get('/', (c) => {
    return c.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        memory: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    });
});
// Self-ping loop to keep the server warm
const SELF_PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const SERVER_URL = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        try {
            const res = await fetch(`${SERVER_URL}/health`);
            console.log(`Self-ping status: ${res.status}`);
        }
        catch (error) {
            console.error('Self-ping failed:', error);
        }
    }, SELF_PING_INTERVAL);
}
