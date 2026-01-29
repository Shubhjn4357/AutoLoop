import { auth } from "@/auth";
import { db } from "@/db";
import { workflowExecutionLogs, automationWorkflows } from "@/db/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workflowId = searchParams.get("workflowId");
        const days = parseInt(searchParams.get("days") || "30");

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const whereConditions = [
            eq(workflowExecutionLogs.userId, session.user.id),
            gte(workflowExecutionLogs.createdAt, sinceDate),
        ];

        if (workflowId) {
            whereConditions.push(eq(workflowExecutionLogs.workflowId, workflowId));
        }

        // Get overall statistics
        const stats = await db
            .select({
                total: count(),
                successful: count(sql`CASE WHEN status = 'success' THEN 1 END`),
                failed: count(sql`CASE WHEN status = 'failed' THEN 1 END`),
                running: count(sql`CASE WHEN status = 'running' THEN 1 END`),
            })
            .from(workflowExecutionLogs)
            .where(and(...whereConditions));

        // Get stats by workflow
        const statsByWorkflow = await db
            .select({
                workflowId: workflowExecutionLogs.workflowId,
                workflowName: automationWorkflows.name,
                total: count(),
                successful: count(sql`CASE WHEN status = 'success' THEN 1 END`),
                failed: count(sql`CASE WHEN status = 'failed' THEN 1 END`),
            })
            .from(workflowExecutionLogs)
            .leftJoin(automationWorkflows, eq(workflowExecutionLogs.workflowId, automationWorkflows.id))
            .where(and(...whereConditions))
            .groupBy(workflowExecutionLogs.workflowId, automationWorkflows.id, automationWorkflows.name);

        // Calculate success rate
        const total = stats[0]?.total || 0;
        const successful = stats[0]?.successful || 0;
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

        return NextResponse.json({
            stats: {
                total,
                successful,
                failed: stats[0]?.failed || 0,
                running: stats[0]?.running || 0,
                successRate,
            },
            statsByWorkflow,
            period: {
                days,
                since: sinceDate.toISOString(),
                until: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching execution stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
