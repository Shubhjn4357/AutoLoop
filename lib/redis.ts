import Redis, { type RedisOptions } from "ioredis";

let redisClient: Redis | null = null;
let initializationAttempted = false;

function getBaseOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn("Redis/Valkey connection failed after retries, continuing without queue cache");
        return null;
      }

      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  };
}

function createClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    return new Redis(redisUrl, getBaseOptions());
  }

  if (process.env.REDIS_HOST || process.env.REDIS_PORT || process.env.REDIS_PASSWORD) {
    return new Redis({
      ...getBaseOptions(),
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
    });
  }

  return null;
}

function attachListeners(client: Redis) {
  client.on("error", (err) => {
    console.warn("Redis/Valkey error:", err.message);
  });

  client.on("end", () => {
    console.warn("Redis/Valkey connection closed");
  });
}

export function getRedis(): Redis | null {
  if (initializationAttempted) {
    return redisClient;
  }

  initializationAttempted = true;

  try {
    const client = createClient();

    if (!client) {
      console.warn("Redis/Valkey not configured, continuing without queue cache");
      redisClient = null;
      return null;
    }

    attachListeners(client);
    redisClient = client;
    return redisClient;
  } catch (error) {
    console.warn("Failed to initialize Redis/Valkey:", error);
    redisClient = null;
    return null;
  }
}

export async function connectRedis(): Promise<Redis | null> {
  const client = getRedis();

  if (!client) {
    return null;
  }

  if (client.status === "ready" || client.status === "connecting" || client.status === "connect") {
    return client;
  }

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.warn(
      "Redis/Valkey connection failed:",
      error instanceof Error ? error.message : String(error)
    );

    if (redisClient === client) {
      redisClient = null;
      initializationAttempted = false;
    }

    return null;
  }
}

export function resetRedisClient() {
  redisClient = null;
  initializationAttempted = false;
}
