import { Queue, Worker } from 'bullmq';
export declare const cronQueue: Queue<any, any, string, any, any, string>;
export declare const initScheduler: () => Promise<Worker<any, any, string>>;
