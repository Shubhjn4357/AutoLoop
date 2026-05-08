import { Queue, Worker } from 'bullmq';
export declare const incomingQueue: Queue<any, any, string, any, any, string>;
export declare const initWorkers: () => Worker<any, any, string>;
