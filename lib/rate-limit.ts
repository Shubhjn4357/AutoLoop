import { redis } from "@/lib/redis";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export class RateLimiter {
  /**
   * Check if a key has exceeded the rate limit
   * @param key Unique identifier (e.g., "email:user_123" or "ip:1.2.3.4")
   * @param config Rate limit configuration
   * @returns { success: boolean, remaining: number, reset: number }
   */
  static async check(key: string, config: RateLimitConfig) {
    if (!redis) {
      console.warn("Redis not available, skipping rate limit check");
      return { success: true, remaining: 1, reset: 0 };
    }

    const { limit, windowSeconds } = config;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const pipeline = redis.pipeline();

    // Remove old requests
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();

    // results[1][1] is the count from zcard BEFORE adding the new request
    // We want to know if the count was ALREADY at limit
    const requestCount = results?.[1]?.[1] as number;

    const remaining = Math.max(0, limit - requestCount);
    const success = requestCount < limit;

    return {
      success,
      remaining,
      reset: Math.floor((now + windowSeconds * 1000) / 1000),
    };
  }

  /**
   * Middleware-like wrapper for API routes
   */
  static async cleanup(key: string) {
    if (redis) {
      await redis.del(key);
    }
  }
}

import { NextResponse } from "next/server";

export async function rateLimit(request: Request, context = "general") {
  if (!redis) return null; // Skip if no Redis

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = `rate_limit:${context}:${ip}`;

  // Default: 100 requests per minute for general API
  const config = { limit: 100, windowSeconds: 60 };

  const result = await RateLimiter.check(key, config);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": String(result.reset - Math.floor(Date.now() / 1000)),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset)
        }
      }
    );
  }

  return null; // OK
}

export async function getRemainingEmails(userId: string): Promise<number> {
  // Limit: 50 emails per day
  const key = `email_limit:${userId}`;
  const config = { limit: 50, windowSeconds: 86400 }; // 24 hours

  if (!redis) return 50;

  const result = await RateLimiter.check(key, config);
  return result.remaining;
}

export async function checkEmailRateLimit(userId: string): Promise<boolean> {
  const remaining = await getRemainingEmails(userId);
  return remaining > 0;
}
