import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dns from 'node:dns';

// Stabilize networking for Hugging Face Spaces
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  console.log('[DNS] Global resolvers set to Google/Cloudflare');
} catch (e) {
  console.warn('[DNS] Failed to set custom servers:', e);
}
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
import { apiAuth } from './app/middleware/api-auth';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());
app.use('/api/*', apiAuth);

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

const port = Number(process.env.PORT) || 7860;
console.log(`Server is running on port ${port}`);

if (process.env.DISABLE_WORKERS === 'true') {
  console.log('Queue workers disabled by DISABLE_WORKERS=true');
} else {
  import('./queue/index')
    .then(({ initWorkers }) => initWorkers())
    .catch((error) => console.error('Failed to start queue workers:', error));

  import('./queue/scheduler')
    .then(({ initScheduler }) => initScheduler())
    .catch((error) => console.error('Failed to start queue scheduler:', error));
}

serve({
  fetch: app.fetch,
  port,
});
