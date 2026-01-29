import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workflowExecutionLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as SessionUser).id;

        // Fetch executions with relations
        // Note: Drizzle query builder with relations is cleaner, but let's stick to core query for control or use db.query
        const executions = await db.query.workflowExecutionLogs.findMany({
            where: eq(workflowExecutionLogs.userId, userId),
            orderBy: [desc(workflowExecutionLogs.startedAt)],
            with: {
                workflow: true,
                business: true,
            },
            limit: 1000 // Reasonable limit for CSV
        });

        // Define CSV Headers
        const headers = [
            "Execution ID",
            "Workflow Name",
            "Business Name",
            "Business Email",
            "Status",
            "Started At",
            "Completed At",
            "Error Message"
        ];

        // Convert to CSV string
        const csvRows = [headers.join(",")];

        for (const exec of executions) {
            const row = [
                exec.id,
                `"${(exec.workflow?.name || "Unknown").replace(/"/g, '""')}"`,
                `"${(exec.business?.name || "Unknown").replace(/"/g, '""')}"`,
                `"${(exec.business?.email || "").replace(/"/g, '""')}"`,
                exec.status,
                exec.startedAt ? new Date(exec.startedAt).toISOString() : "",
                exec.completedAt ? new Date(exec.completedAt).toISOString() : "",
                `"${(exec.error || "").replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvContent = csvRows.join("\n");

        // Return as CSV file
        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="workflow-executions-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error("Error exporting CSV:", error);
        return NextResponse.json(
            { error: "Failed to export CSV" },
            { status: 500 }
        );
    }
}
