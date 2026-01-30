import Redis from "ioredis";

let redis: Redis | null = null;
let connectionAttempted = false;

export function getRedis(): Redis | null {
  if (connectionAttempted) {
    return redis;
  }

  try {
    connectionAttempted = true;

    // Don't attempt connection if no Redis URL is provided
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      console.warn("Redis not configured, continuing without Redis");
      return null;
    }

    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      // BullMQ requires this to be null
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("Redis connection failed after retries, continuing without Redis");
          return null; // Stop retrying
        }
        return Math.min(times * 50, 200);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    // Attempt to connect (non-blocking)
    redis.connect().catch((err) => {
      console.warn("Redis connection failed:", err.message);
      redis = null;
    });

    redis.on("error", (err) => {
      console.warn("Redis error:", err.message);
    });

    return redis;
  } catch (error) {
    console.warn("Failed to initialize Redis:", error);
    redis = null;
    return null;
  }
}

// For backward compatibility
redis = getRedis();
export { redis };