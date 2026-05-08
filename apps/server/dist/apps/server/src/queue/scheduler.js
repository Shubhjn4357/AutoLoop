import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { automationEngine } from '../automation/engine';
import { db, and, eq, lte, scheduledMessages } from '@autoloop/db';
export const cronQueue = new Queue('cron-tasks', {
    connection: redisConnection,
});
export const initScheduler = async () => {
    // Add a repeatable job to poll for scheduled messages every minute
    await cronQueue.add('poll-scheduled-messages', {}, {
        repeat: { pattern: '* * * * *' },
        removeOnComplete: true,
    });
    const worker = new Worker('cron-tasks', async (job) => {
        if (job.name === 'poll-scheduled-messages') {
            console.log('[Scheduler] Polling for scheduled messages...');
            const now = new Date();
            const due = await db.query.scheduledMessages.findMany({
                where: and(eq(scheduledMessages.status, 'pending'), lte(scheduledMessages.dueAt, now)),
                limit: 50,
            });
            for (const msg of due) {
                // Add to processing queue
                await automationEngine.processScheduledMessage(msg.id);
            }
        }
    }, { connection: redisConnection });
    return worker;
};
