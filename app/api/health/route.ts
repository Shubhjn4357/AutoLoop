import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { Logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Record<string, { status: boolean; message?: string; latency?: number }>;
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const checks: HealthCheck["checks"] = {};

  // Check Database
  try {
    const dbStart = performance.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Math.round(performance.now() - dbStart);
    checks.database = {
      status: true,
      latency: dbLatency,
      message: `Connected in ${dbLatency}ms`,
    };
  } catch (error) {
    Logger.error("Health check - DB failed", error as Error);
    checks.database = {
      status: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Check Redis
  try {
    const redisStart = performance.now();
    if (redis) {
      await redis.ping();
      const redisLatency = Math.round(performance.now() - redisStart);
      checks.redis = {
        status: true,
        latency: redisLatency,
        message: `Connected in ${redisLatency}ms`,
      };
    } else {
      checks.redis = {
        status: false,
        message: "Redis client not initialized",
      };
    }
  } catch (error) {
    Logger.error("Health check - Redis failed", error as Error);
    checks.redis = {
      status: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Check Gemini API (optional)
  try {
    const geminiStart = performance.now();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const geminiLatency = Math.round(performance.now() - geminiStart);

    checks.gemini = {
      status: response.ok,
      latency: geminiLatency,
      message: response.ok
        ? `Available in ${geminiLatency}ms`
        : `API returned ${response.status}`,
    };
  } catch (error) {
    checks.gemini = {
      status: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Determine overall status (database is critical)
  const overallStatus =
    checks.database?.status === false
      ? "unhealthy"
      : !Object.values(checks).every((check) => check.status)
        ? "degraded"
        : "healthy";

  const httpStatus = overallStatus === "healthy" ? 200 : 503;

  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };

  if (overallStatus !== "healthy") {
    Logger.warn("Health check failed", {
      status: overallStatus,
      failedChecks: Object.entries(checks)
        .filter(([, check]) => !check.status)
        .map(([name]) => name),
    });
  }

  return NextResponse.json(healthCheck, { status: httpStatus });
}

/**
 * Liveness probe - checks if service is running
 * For Kubernetes/Docker deployments
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick database connectivity check
    await db.execute(sql`SELECT 1`);
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
