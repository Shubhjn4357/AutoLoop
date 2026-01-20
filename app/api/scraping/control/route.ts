import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scrapingJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId || !action) {
      return NextResponse.json(
        { error: "Job ID and action are required" },
        { status: 400 }
      );
    }

    const allowedActions = ["pause", "resume", "stop", "set-priority"];
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'pause', 'resume', 'stop', or 'set-priority'" },
        { status: 400 }
      );
    }

    // Find the job and verify ownership
    const [job] = await db
      .select()
      .from(scrapingJobs)
      .where(and(eq(scrapingJobs.id, jobId), eq(scrapingJobs.userId, userId)))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Update job status based on action
    let newStatus = job.status;
    let newPriority = job.priority;

    if (["pause", "resume", "stop"].includes(action)) {
      switch (action) {
        case "pause":
          newStatus = "paused";
          break;
        case "resume":
          newStatus = "running";
          break;
        case "stop":
          newStatus = "failed";
          break;
      }
    } else if (action === "set-priority") {
      // Handle priority update
      const { priority } = body;
      if (!priority || !["low", "medium", "high"].includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      newPriority = priority;
    } else {
      newStatus = job.status;
    }

    // Update the job
    const [updatedJob] = await db
      .update(scrapingJobs)
      .set({
        status: newStatus,
        priority: newPriority,
        ...(action === "stop" && { completedAt: new Date() }),
      })
      .where(eq(scrapingJobs.id, jobId))
      .returning();

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error: unknown) {
    console.error("Error controlling scraping job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to control job" },
      { status: 500 }
    );
  }
}
