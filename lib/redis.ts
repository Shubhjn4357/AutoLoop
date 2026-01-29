import Redis from "ioredis";

// Use a global variable to preserve the client across hot reloads in development
const globalForRedis = global as unknown as { redis: Redis };

const redisConfig = {
  // Retry strategy for connection issues
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Max retries per request
  maxRetriesPerRequest: null,
  // Enable offline queue to buffer commands when disconnected
  enableOfflineQueue: true,
};

let redis: Redis;

if (process.env.NODE_ENV === "production" || !globalForRedis.redis) {
  try {
    if (process.env.REDIS_URL) {
      console.log("Initializing Redis...");
      redis = new Redis(process.env.REDIS_URL, redisConfig);
    } else {
      console.warn("REDIS_URL is not defined. Using default localhost:6379");
      redis = new Redis({ ...redisConfig, host: 'localhost', port: 6379 });
    }

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis Client Connected');
    });
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    // Fallback or crash safely? For now, we allow the app to run but queue features will fail.
    // We create a dummy redis client to prevent immediate crashes on import if init fails completely (unexpected)
    redis = new Redis({ ...redisConfig, lazyConnect: true });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
  }
} else {
  redis = globalForRedis.redis;
}

export { redis };
