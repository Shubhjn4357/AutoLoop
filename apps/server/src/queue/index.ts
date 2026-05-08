import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { automationEngine } from '../automation/engine';

export const incomingQueue = new Queue('incoming-messages', {
  connection: redisConnection,
});

export const initWorkers = () => {
  const worker = new Worker(
    'incoming-messages',
    async (job) => {
      console.log(`Processing job ${job.id} of type ${job.name}`);
      try {
        if (job.name === 'webhook-event') {
          await automationEngine.processEvent(job.data);
        } else if (job.name === 'process-queued-event') {
          await automationEngine.processQueuedEvent(job.data.eventId);
        }
      } catch (error) {

        console.error(`Error processing job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
};
