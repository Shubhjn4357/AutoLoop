import { Hono } from 'hono';
import { db, automations, automationMetrics, scheduledMessages, eq, and, desc, lte } from '@autoloop/db';

export const automationRouter = new Hono();

automationRouter.get('/', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const rules = await db.query.automations.findMany({
      where: eq(automations.userId, userId),
      orderBy: [desc(automations.createdAt)],
    });
    return c.json(rules);
  } catch (error) {
    return c.json({ error: 'Failed to fetch' }, 500);
  }
});

automationRouter.post('/', async (c) => {
  const { userId, id, ...data } = await c.req.json();
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    if (id) {
      const [updated] = await db
        .update(automations)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(automations.id, id), eq(automations.userId, userId)))
        .returning();
      return c.json(updated);
    } else {
      const [created] = await db
        .insert(automations)
        .values({ 
          ...data, 
          id: crypto.randomUUID(),
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return c.json(created);
    }
  } catch (error) {
    return c.json({ error: 'Failed to save' }, 500);
  }
});

automationRouter.delete('/', async (c) => {
  const userId = c.req.query('userId');
  const id = c.req.query('id');
  if (!userId || !id) return c.json({ error: 'Missing params' }, 400);

  try {
    await db
      .delete(automations)
      .where(and(eq(automations.id, id), eq(automations.userId, userId)));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete' }, 500);
  }
});

automationRouter.post('/followups', async (c) => {
  try {
    const now = new Date();
    const due = await db.query.scheduledMessages.findMany({
      where: and(
        eq(scheduledMessages.status, 'pending'),
        lte(scheduledMessages.dueAt, now)
      ),
      limit: 50,
    });
    const { automationEngine } = await import('../../automation/engine');

    for (const message of due) {
      await automationEngine.processScheduledMessage(message.id);
    }

    return c.json({ success: true, processed: due.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process follow-ups';
    return c.json({ error: message }, 500);
  }
});

automationRouter.get('/metrics', async (c) => {
  const userId = c.req.query('userId');
  const automationId = c.req.query('automationId');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    if (automationId) {
      const metric = await db.query.automationMetrics.findFirst({
        where: eq(automationMetrics.automationId, automationId),
      });
      return c.json(metric ?? { sendCount: 0, replyCount: 0 });
    }

    const allMetrics = await db.query.automationMetrics.findMany({
      where: eq(automationMetrics.userId, userId),
    });
    return c.json(allMetrics);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
