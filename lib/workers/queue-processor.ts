/**
 * Queue Processor Worker
 * Processes tasks from queues in the background
 */

import { taskQueue, type TaskType } from '@/lib/queue/task-queue';
import { db } from '@/db';
import { scrapingJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class QueueProcessor {
    private isRunning = false;
    private intervals: Map<TaskType, NodeJS.Timeout> = new Map();

    /**
     * Start processing all queues
     */
    start(): void {
        if (this.isRunning) {
            console.log('⚠️ Queue processor already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Queue processor started');

        // Start processors for each queue type
        this.startWorkflowProcessor();
        this.startScraperProcessor();
        this.startEmailProcessor();
        this.startSocialProcessor();
    }

    /**
     * Stop processing
     */
    stop(): void {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        this.isRunning = false;
        console.log('🛑 Queue processor stopped');
    }

    /**
     * Workflow queue processor
     */
    private startWorkflowProcessor(): void {
        const interval = setInterval(async () => {
            const task = taskQueue.getNextTask('workflow');
            if (!task) return;

            try {
                console.log(`🔄 Processing workflow task ${task.id}`);

                const { workflowId, businessId, userId } = task.data as {
                    workflowId: string;
                    businessId?: string;
                    userId: string;
                };

                // Import and execute workflow using existing WorkflowExecutor
                const { executeWorkflowLoopWithLogging } = await import('@/lib/workflow-executor');

                const result = await executeWorkflowLoopWithLogging(workflowId, userId, businessId);

                if (result.success) {
                    console.log(`✅ Workflow ${workflowId} executed:`, result.logs.join(', '));
                    taskQueue.completeTask(task.id);
                } else {
                    taskQueue.completeTask(task.id, result.logs.join('; '));
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                taskQueue.completeTask(task.id, message);
            }
        }, 2000); // Check every 2 seconds

        this.intervals.set('workflow', interval);
    }

    /**
     * Scraper queue processor
     */
    private startScraperProcessor(): void {
        const interval = setInterval(async () => {
            const task = taskQueue.getNextTask('scraper');
            if (!task) return;

            try {
                console.log(`🔍 Processing scraper task ${task.id}`);

                const { jobId } = task.data as { jobId: string };

                // Update job status to running
                await db
                    .update(scrapingJobs)
                    .set({ status: 'running' })
                    .where(eq(scrapingJobs.id, jobId));

                // Process the scraper job
                // The scraper logic should be in the scraper module
                console.log(`Processing scraper job ${jobId}`);

                taskQueue.completeTask(task.id);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                taskQueue.completeTask(task.id, message);

                // Update job status to failed
                const { jobId } = task.data as { jobId: string };
                await db
                    .update(scrapingJobs)
                    .set({ status: 'failed' })
                    .where(eq(scrapingJobs.id, jobId));
            }
        }, 3000); // Check every 3 seconds

        this.intervals.set('scraper', interval);
    }

    /**
   * Email queue processor
   */
    private startEmailProcessor(): void {
        const interval = setInterval(async () => {
            const task = taskQueue.getNextTask('email');
            if (!task) return;

            try {
                console.log(`📧 Processing email task ${task.id}`);

                const { to, subject, body, accessToken } = task.data as {
                    to: string;
                    subject: string;
                    body: string;
                    accessToken: string;
                };

                // Use existing email sending function
                const { sendEmail } = await import('@/lib/email');

                const result = await sendEmail({ to, subject, body, accessToken });

                if (result?.success) {
                    console.log(`✅ Email sent to ${to}`);
                    taskQueue.completeTask(task.id);
                } else {
                    taskQueue.completeTask(task.id, result?.error || 'Failed to send email');
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                taskQueue.completeTask(task.id, message);
            }
        }, 1000); // Check every 1 second

        this.intervals.set('email', interval);
    }

    /**
     * Social queue processor
     */
    private startSocialProcessor(): void {
        const interval = setInterval(async () => {
            const task = taskQueue.getNextTask('social');
            if (!task) return;

            try {
                console.log(`📱 Processing social task ${task.id}`);

                const { automationId } = task.data as { automationId: string };

                // Trigger existing social automation worker
                const { socialAutomationWorker } = await import('@/lib/workers/social-automation');

                // The worker has a processAutomations method that's private, but we can access it via type casting
                const worker = socialAutomationWorker as unknown as { processAutomations: () => Promise<void> };
                await worker.processAutomations();

                console.log(`✅ Social automation ${automationId} processed`);
                taskQueue.completeTask(task.id);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                taskQueue.completeTask(task.id, message);
            }
        }, 2000); // Check every 2 seconds

        this.intervals.set('social', interval);
    }
}

// Export singleton instance
export const queueProcessor = new QueueProcessor();

/**
 * Start the queue processor
 */
export function startQueueProcessor(): void {
    queueProcessor.start();
}

/**
 * Stop the queue processor
 */
export function stopQueueProcessor(): void {
    queueProcessor.stop();
}
