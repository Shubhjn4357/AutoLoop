import { auth } from "@/auth";
import { db } from "@/db";
import { workflowExecutionLogs, automationWorkflows } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workflowId = searchParams.get("workflowId");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "100");
        const offset = parseInt(searchParams.get("offset") || "0");
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

        if (status) {
            whereConditions.push(eq(workflowExecutionLogs.status, status));
        }

        // Get total count
        const countResult = await db
            .select()
            .from(workflowExecutionLogs)
            .where(and(...whereConditions));

        // Get paginated results with workflow info
        const executions = await db
            .select({
                id: workflowExecutionLogs.id,
                workflowId: workflowExecutionLogs.workflowId,
                workflowName: automationWorkflows.name,
                businessId: workflowExecutionLogs.businessId,
                status: workflowExecutionLogs.status,
                logs: workflowExecutionLogs.logs,
                error: workflowExecutionLogs.error,
                startedAt: workflowExecutionLogs.startedAt,
                completedAt: workflowExecutionLogs.completedAt,
                createdAt: workflowExecutionLogs.createdAt,
            })
            .from(workflowExecutionLogs)
            .leftJoin(automationWorkflows, eq(workflowExecutionLogs.workflowId, automationWorkflows.id))
            .where(and(...whereConditions))
            .orderBy(desc(workflowExecutionLogs.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            executions,
            total: countResult.length,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error fetching executions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
