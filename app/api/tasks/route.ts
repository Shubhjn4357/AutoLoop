import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scrapingJobs, automationWorkflows } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch scraping jobs
        const jobs = await db
            .select({
                id: scrapingJobs.id,
                workflowId: scrapingJobs.workflowId,
                status: scrapingJobs.status,
                priority: scrapingJobs.priority,
                businessesFound: scrapingJobs.businessesFound,
                createdAt: scrapingJobs.createdAt,
                completedAt: scrapingJobs.completedAt,
                workflowName: automationWorkflows.name,
            })
            .from(scrapingJobs)
            .leftJoin(automationWorkflows, eq(scrapingJobs.workflowId, automationWorkflows.id))
            .where(eq(scrapingJobs.userId, userId))
            .orderBy(desc(scrapingJobs.createdAt))
            .limit(100); // Limit results for performance

        // Fetch active workflows (limit to recent)
        const workflows = await db
            .select({
                id: automationWorkflows.id,
                name: automationWorkflows.name,
                isActive: automationWorkflows.isActive,
                priority: automationWorkflows.priority,
                createdAt: automationWorkflows.createdAt,
            })
            .from(automationWorkflows)
            .where(eq(automationWorkflows.userId, userId))
            .orderBy(desc(automationWorkflows.createdAt))
            .limit(100);

        // Combine scraping jobs and workflows into tasks
        const scrapingTasks = jobs.map((job) => ({
            id: job.id,
            title: job.workflowName ? `Scraping: ${job.workflowName}` : "Independent Scraping",
            description: `Finding businesses - ${job.businessesFound || 0} found`,
            status: job.status, // Keep original status for control buttons
            priority: job.priority || "medium",
            type: "scraping" as const,
            businessesFound: job.businessesFound || 0,
            workflowName: job.workflowName || "Business Scraping",
            createdAt: job.createdAt,
        }));

        const workflowTasks = workflows.map((workflow) => ({
            id: workflow.id,
            title: `Workflow: ${workflow.name}`,
            description: workflow.isActive ? "Active automation running" : "Workflow paused",
            status: workflow.isActive ? ("in-progress" as const) : ("pending" as const),
            priority: workflow.priority || "high",
            type: "workflow" as const,
            workflowName: workflow.name,
            createdAt: workflow.createdAt,
        }));

        // Combine and sort by creation date
        const allTasks = [...scrapingTasks, ...workflowTasks].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(allTasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const type = searchParams.get("type");
        const userId = session.user.id;

        if (!id || !type) {
            return NextResponse.json({ error: "ID and type required" }, { status: 400 });
        }

        if (type === "workflow") {
            await db
                .delete(automationWorkflows)
                .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.userId, userId)));
        } else {
            await db
                .delete(scrapingJobs)
                .where(and(eq(scrapingJobs.id, id), eq(scrapingJobs.userId, userId)));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
