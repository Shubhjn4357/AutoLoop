import { Redis } from 'ioredis';

const host = process.env.REDIS_HOST || 'localhost';
const port = Number(process.env.REDIS_PORT) || 6379;

console.log(`[Redis] Connecting to ${host}:${port}`);

export const redisConnection = new Redis({
  host,
  port,
  maxRetriesPerRequest: null,
});
