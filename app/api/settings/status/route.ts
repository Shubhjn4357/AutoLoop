import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import Redis from "ioredis";

export async function GET() {
  let dbStatus = false;
  let redisStatus = false;

  // Check Database
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = true;
  } catch (error) {
    console.error("Database check failed:", error);
  }

  // Check Redis
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    
    await redis.ping();
    redisStatus = true;
    redis.disconnect();
  } catch (error) {
    console.error("Redis check failed:", error);
  }

  return NextResponse.json({
    database: dbStatus,
    redis: redisStatus,
  });
}
