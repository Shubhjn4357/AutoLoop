import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redis } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
    }
  };

  let statusCode = 200;

  // Check Database
  try {
    await db.execute(sql`SELECT 1`);
    health.services.database = "up";
  } catch (error) {
    console.error("Health check - DB failed:", error);
    health.services.database = "down";
    health.status = "error";
    statusCode = 503;
  }

  // Check Redis
  try {
    if (redis) {
      await redis.ping();
      health.services.redis = "up";
    } else {
      health.services.redis = "not_configured";
    }
  } catch (error) {
    console.error("Health check - Redis failed:", error);
    health.services.redis = "down";
    health.status = "error";
    statusCode = 503;
  }

  return NextResponse.json(health, { status: statusCode });
}
