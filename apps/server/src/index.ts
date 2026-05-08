import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { healthRouter } from './health/index';
import { webhookRouter } from './webhook/index';
import { aiRouter } from './app/routes/ai';
import { automationRouter } from './app/routes/automation';
import { broadcastRouter } from './app/routes/broadcast';
import { contactsRouter } from './app/routes/contacts';
import { instagramRouter } from './app/routes/instagram';
import { messagesRouter } from './app/routes/messages';
import { insightsRouter } from './app/routes/insights';
import { userRouter } from './app/routes/user';
import { initWorkers } from './queue/index';
import { initScheduler } from './queue/scheduler';

config();

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Autoloop Automation Server is running!');
});

app.route('/health', healthRouter);
app.route('/api/webhook', webhookRouter);
app.route('/api/ai', aiRouter);
app.route('/api/automation', automationRouter);
app.route('/api/broadcast', broadcastRouter);
app.route('/api/contacts', contactsRouter);
app.route('/api/instagram', instagramRouter);
app.route('/api/messages', messagesRouter);
app.route('/api/insights', insightsRouter);
app.route('/api/user', userRouter);

setInterval(async () => {
  try {
    const res = await fetch(`${process.env.SERVER_BASE_URL}/health`);
    console.log(`Self-ping status: ${res.status}`);
  } catch (err) {
    console.error('Self-ping failed:', err);
  }
}, 1000 * 60 * 5); // 5 minutes

const port = Number(process.env.PORT) || 7860;
console.log(`Server is running on port ${port}`);

// Initialize BullMQ workers
initWorkers();
initScheduler();

serve({
  fetch: app.fetch,
  port,
});
