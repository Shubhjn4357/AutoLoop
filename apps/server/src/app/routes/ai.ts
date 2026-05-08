import { Hono } from 'hono';
import { db, messages, eq, desc } from '@autoloop/db';
import { generateSmartReply } from '../../ai/pipeline';

export const aiRouter = new Hono();

aiRouter.post('/suggest-reply', async (c) => {
  // TODO: Add auth middleware
  try {
    const { senderId } = await c.req.json();
    if (!senderId) return c.json({ error: 'Missing senderId' }, 400);

    const thread = await db.query.messages.findMany({
      where: eq(messages.senderId, senderId),
      orderBy: [desc(messages.timestamp)],
      limit: 10,
    });

    if (thread.length === 0) {
      return c.json({ error: 'No messages found' }, 404);
    }

    const lastMessage = thread.find(m => m.direction === 'inbound');
    if (!lastMessage) {
      return c.json({ error: 'No user message found' }, 404);
    }

    const history = thread.reverse().map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.text,
    }));

    const result = await generateSmartReply({
      userMessage: lastMessage.text,
      context: JSON.stringify({ history }),
    });

    return c.json({ suggestion: result ?? null });
  } catch (error) {
    console.error('[AI API] Suggestion failed:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
