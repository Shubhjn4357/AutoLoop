import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, automationWorkflows } from "@/db/schema";
import { count } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const redis = getRedis();

        // Parallel database queries for speed
        const [
            totalUsersResult,
            totalWorkflowsResult
        ] = await Promise.all([
            db.select({ count: count() }).from(users),
            db.select({ count: count() }).from(automationWorkflows)
        ]);

        let systemHealth = "degraded";
        if (redis) {
            try {
                const ping = await redis.ping();
                if (ping === "PONG") systemHealth = "healthy";
            } catch {
                systemHealth = "degraded";
            }
        }

        const totalUsers = totalUsersResult[0]?.count || 0;
        const totalWorkflows = totalWorkflowsResult[0]?.count || 0;

        // Mocking active users as 60% of total for now
        const activeUsers = Math.floor(totalUsers * 0.6);

        return NextResponse.json({
            totalUsers,
            userGrowth: 15, // Placeholder
            activeUsers,
            totalWorkflows,
            systemHealth
        });
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
