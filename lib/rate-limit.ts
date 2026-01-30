import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

/**
 * Rate limit configurations per endpoint/context
 * Can be customized based on user tier, feature, or endpoint
 */
export const RATE_LIMIT_CONFIG = {
  // General API rate limiting
  general: { limit: 100, windowSeconds: 60 }, // 100 req/min
  api_default: { limit: 100, windowSeconds: 60 },

  // Email-specific rate limiting
  email: { limit: 50, windowSeconds: 86400 }, // 50 emails/day
  email_send: { limit: 10, windowSeconds: 60 }, // 10 emails/min
  email_batch: { limit: 100, windowSeconds: 3600 }, // 100 emails/hour

  // Scraping rate limiting
  scraping: { limit: 10, windowSeconds: 60 }, // 10 scrape jobs/min
  scraping_start: { limit: 5, windowSeconds: 300 }, // 5 scrape jobs/5min
  scraping_search: { limit: 20, windowSeconds: 60 }, // 20 searches/min

  // Authentication rate limiting
  auth: { limit: 5, windowSeconds: 60 }, // 5 attempts/min
  auth_login: { limit: 5, windowSeconds: 60 },
  auth_signup: { limit: 3, windowSeconds: 300 }, // 3 signups/5min

  // Workflow operations
  workflow_create: { limit: 50, windowSeconds: 3600 }, // 50 creations/hour
  workflow_execute: { limit: 100, windowSeconds: 60 }, // 100 executions/min
  workflow_update: { limit: 50, windowSeconds: 60 }, // 50 updates/min

  // API operations
  api_search: { limit: 30, windowSeconds: 60 }, // 30 searches/min
  api_export: { limit: 10, windowSeconds: 3600 }, // 10 exports/hour
  api_upload: { limit: 20, windowSeconds: 3600 }, // 20 uploads/hour
} as const;

export type RateLimitContext = keyof typeof RATE_LIMIT_CONFIG;

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
   * Cleanup rate limit key (clear from Redis)
   */
  static async cleanup(key: string) {
    if (redis) {
      await redis.del(key);
    }
  }
}

/**
 * Legacy rate limit function for backward compatibility
 */
export async function rateLimit(request: Request, context: string = "general") {
  if (!redis) return null; // Skip if no Redis

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = `rate_limit:${context}:${ip}`;

  // Get config for context
  const config =
    RATE_LIMIT_CONFIG[context as RateLimitContext] || RATE_LIMIT_CONFIG.general;

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
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null; // OK
}

/**
 * Enhanced rate limit check that returns structured result
 * Useful for conditional rate limiting
 */
export async function checkRateLimit(
  request: NextRequest | Request,
  context: RateLimitContext = "general"
): Promise<{
  limited: boolean;
  remaining: number;
  reset: number;
  response?: NextResponse;
}> {
  if (!redis) {
    return { limited: false, remaining: 999, reset: 0 };
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = `rate_limit:${context}:${ip}`;
  const config = RATE_LIMIT_CONFIG[context] || RATE_LIMIT_CONFIG.general;

  const result = await RateLimiter.check(key, config);

  if (!result.success) {
    return {
      limited: true,
      remaining: result.remaining,
      reset: result.reset,
      response: NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.reset - Math.floor(Date.now() / 1000)),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      ),
    };
  }

  return {
    limited: false,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export async function getRemainingEmails(userId: string): Promise<number> {
  // Limit: 50 emails per day
  const key = `email_limit:${userId}`;
  const config = RATE_LIMIT_CONFIG.email;

  if (!redis) return 50;

  const result = await RateLimiter.check(key, config);
  return result.remaining;
}

export async function checkEmailRateLimit(userId: string): Promise<boolean> {
  const remaining = await getRemainingEmails(userId);
  return remaining > 0;
}
