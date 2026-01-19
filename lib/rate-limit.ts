import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Rate limit configuration
const RATE_LIMITS = {
  scraping: { windowMs: 60 * 1000, max: 5 },  // 5 requests per minute
  email: { windowMs: 60 * 1000, max: 20 },     // 20 emails per minute
  api: { windowMs: 60 * 1000, max: 100 },      // 100 API calls per minute
};

// In-memory store (use Redis in production)
const requestStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: Request,
  type: keyof typeof RATE_LIMITS = "api"
): Promise<NextResponse | null> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  
  const key = `${type}:${ip}`;
  const limit = RATE_LIMITS[type];
  const now = Date.now();

  const record = requestStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or reset time passed
    requestStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
    });
    return null; // Allow request
  }

  if (record.count >= limit.max) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": record.resetTime.toString(),
          "Retry-After": Math.ceil((record.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  // Increment counter
  record.count++;
  requestStore.set(key, record);

  return null; // Allow request
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Get rate limit info for a key
 */
export function getRateLimitInfo(ip: string, type: keyof typeof RATE_LIMITS) {
  const key = `${type}:${ip}`;
  const limit = RATE_LIMITS[type];
  const record = requestStore.get(key);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      limit: limit.max,
      remaining: limit.max,
      reset: now + limit.windowMs,
    };
  }

  return {
    limit: limit.max,
    remaining: Math.max(0, limit.max - record.count),
    reset: record.resetTime,
  };
}
