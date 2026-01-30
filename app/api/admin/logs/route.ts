import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workflowExecutionLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const recentLogs = await db
            .select({
                id: workflowExecutionLogs.id,
                status: workflowExecutionLogs.status,
                createdAt: workflowExecutionLogs.createdAt,
                userId: workflowExecutionLogs.userId,
                workflowId: workflowExecutionLogs.workflowId,
            })
            .from(workflowExecutionLogs)
            .orderBy(desc(workflowExecutionLogs.createdAt))
            .limit(20);

        const enrichedLogs = await Promise.all(recentLogs.map(async (log) => {
            // Need to handle null userId if that's possible in schema, assuming not null for now
            // If userId is null, we can't fetch user name
            let userName = "Unknown User";

            if (log.userId) {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, log.userId),
                    columns: { name: true }
                });
                if (user?.name) userName = user.name;
            }

            return {
                id: log.id,
                type: log.status === "completed" ? "success" : log.status === "failed" ? "error" : "info",
                message: `Workflow execution ${log.status} for ${userName}`,
                timestamp: log.createdAt,
                metadata: { workflowId: log.workflowId }
            };
        }));

        return NextResponse.json({ logs: enrichedLogs });
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
