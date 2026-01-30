import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scrapingJobs } from "@/db/schema";
import { queueScraping } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";
import type { SessionUser } from "@/types";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, "scraping");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await request.json();
    const { targetBusinessType, keywords, location, sources = ["google-maps"] } = body;

    if (!targetBusinessType || !location) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Check for existing active job with same parameters
    const [existingJob] = await db
      .select()
      .from(scrapingJobs)
      .where(
        and(
          eq(scrapingJobs.userId, userId),
          eq(scrapingJobs.status, "pending"), // Check pending
          // We could also check 'processing' or 'running' if we want to strict prevent parallel same-jobs
          // But user might want to restart? Let's strictly prevent Pending duplicates to avoid queue spam
          // For now, let's just check pending to verify queue behavior.
          // Better: Check active status to prevent double-running the exact same search
        )
      );

    // More robust duplicate check properly using jsonb keywords comparison is complex in SQL
    // Simplified: Check if there's a job created recently (last 1 min) with same target/location to prevent double-click
    // Or better: Trust the user but just return existing if it's EXACT same request and still pending

    if (existingJob) {
      console.log(`⚠️ Prevented duplicate scraping job: ${existingJob.id} is pending`);
      return NextResponse.json({
        message: "Existing pending job found",
        jobId: existingJob.id,
      });
    }

    // Create scraping job directly without workflow
    const [job] = await db
      .insert(scrapingJobs)
      .values({
        userId,
        workflowId: null, // No workflow needed
        keywords: keywords || [], // Allow empty keywords
        status: "pending",
        businessesFound: 0,
      })
      .returning();

    // Queue the scraping job
    await queueScraping({
      userId,
      jobId: job.id,
      keywords: keywords || [],
      location,
      targetBusinessType,
      sources, // Pass selected sources
    });

    console.log(`🚀 Scraping job ${job.id} queued for processing`);

    return NextResponse.json({
      message: "Scraping job started",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error starting scraping:", error);
    return NextResponse.json(
      { error: "Failed to start scraping" },
      { status: 500 }
    );
  }
}

/**
 * Get scraping job status
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      // Get specific job status
      const job = await db.query.scrapingJobs.findFirst({
        where: (jobs, { eq, and }) =>
          and(eq(jobs.id, jobId), eq(jobs.userId, userId)),
      });

      return NextResponse.json({ job });
    }

    // Get all jobs
    const jobs = await db.query.scrapingJobs.findMany({
      where: (jobs, { eq }) => eq(jobs.userId, userId),
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
      limit: 10,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching scraping jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch scraping jobs" },
      { status: 500 }
    );
  }
}
