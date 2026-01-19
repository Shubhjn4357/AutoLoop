import { NextResponse } from "next/server";
import Redis from "ioredis";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getQueueStats } from "@/lib/queue";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    redis: { status: string; latency: number };
    database: { status: string; latency: number };
    queue: { status: string; stats: unknown };
  };
}

export async function GET() {
  const healthChecks: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      redis: { status: "unknown", latency: 0 },
      database: { status: "unknown", latency: 0 },
      queue: { status: "unknown", stats: null },
    },
  };

  // Check Redis connection
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    });

    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    healthChecks.services.redis = { status: "healthy", latency };
    await redis.disconnect();
  } catch {
    healthChecks.services.redis = { status: "unhealthy", latency: -1 };
    healthChecks.status = "degraded";
  }

  // Check Database connection
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;

    healthChecks.services.database = { status: "healthy", latency };
  } catch {
    healthChecks.services.database = { status: "unhealthy", latency: -1 };
    healthChecks.status = "unhealthy";
  }

  // Check Queue stats
  try {
    const stats = await getQueueStats();
    healthChecks.services.queue = {
      status: "healthy",
      stats,
    };
  } catch {
    healthChecks.services.queue = {
      status: "unhealthy",
      stats: null,
    };
    healthChecks.status = "degraded";
  }

  const statusCode = healthChecks.status === "healthy" ? 200 : 503;
  return NextResponse.json(healthChecks, { status: statusCode });
}
