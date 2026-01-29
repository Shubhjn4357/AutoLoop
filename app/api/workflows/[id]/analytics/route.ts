
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { workflowExecutionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEffectiveUserId } from "@/lib/auth-utils";

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);
    const workflowId = params.id;

    // 1. Get Execution Stats
    const executions = await db.query.workflowExecutionLogs.findMany({
        where: and(
            eq(workflowExecutionLogs.workflowId, workflowId),
            eq(workflowExecutionLogs.userId, userId)
        ),
    });

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === "success").length;
    const failedExecutions = executions.filter(e => e.status === "failed").length;

    // 2. Get Email Stats (via Email Logs joined with business which we can approximate or use logs)
    // Since we don't have direct link from emailLog to workflow, we can try to infer or if we added workflowId to emailLogs (we didn't).
    // We can filter emailLogs for businesses that were processed by this workflow.
    // Or better, just return general stats for now or assume all emails to businesses in executions

    // Improvement: Add workflowId to emailLogs for better analytics
    // For now, let's look at workflowExecutionLogs logs content? No, unlikely to be efficient.

    // Let's rely on business category match?
    // Or we can just return execution stats which is better than nothing.

    // Actually, we can fetch all emailLogs for the User and filter by date range of workflow?
    // Let's just return execution stats for now as it is reliable.

    const executionStats = {
        total: totalExecutions,
        success: successfulExecutions,
        failed: failedExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
    };

    return NextResponse.json({
        analytics: {
            executions: executionStats,
            // Placeholder for email metrics until we link emailLogs to workflow
            emailMetrics: {
                sent: successfulExecutions, // Approx
                opened: 0,
                clicked: 0
            }
        }
    });
}
