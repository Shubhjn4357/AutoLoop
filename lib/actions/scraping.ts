/**
 * Scraping Server Actions
 * Handles all scraping-related operations
 */

"use server";

import { db } from "@/db";
import { scrapingJobs } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function getScrapingJobs(limit = 20, offset = 0) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const jobs = await db
    .select()
    .from(scrapingJobs)
    .where(eq(scrapingJobs.userId, session.user.id))
    .orderBy(desc(scrapingJobs.createdAt))
    .limit(limit)
    .offset(offset);

  return jobs;
}

export async function getScrapingJobById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const job = await db.query.scrapingJobs.findFirst({
    where: and(
      eq(scrapingJobs.id, id),
      eq(scrapingJobs.userId, session.user.id)
    ),
  });

  if (!job) {
    throw new Error("Scraping job not found");
  }

  return job;
}

export async function getScrapingStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const stats = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`sum(case when ${scrapingJobs.status} = 'pending' then 1 else 0 end)`,
    running: sql<number>`sum(case when ${scrapingJobs.status} = 'running' then 1 else 0 end)`,
    completed: sql<number>`sum(case when ${scrapingJobs.status} = 'completed' then 1 else 0 end)`,
    failed: sql<number>`sum(case when ${scrapingJobs.status} = 'failed' then 1 else 0 end)`,
    totalResults: sql<number>`sum(${scrapingJobs.businessesFound})`,
  })
    .from(scrapingJobs)
    .where(eq(scrapingJobs.userId, session.user.id));

  return stats[0];
}

export async function cancelScrapingJob(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [updated] = await db
    .update(scrapingJobs)
    .set({
      status: "failed",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(scrapingJobs.id, id),
        eq(scrapingJobs.userId, session.user.id)
      )
    )
    .returning();

  return updated;
}

export async function deleteScrapingJob(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(scrapingJobs)
    .where(
      and(
        eq(scrapingJobs.id, id),
        eq(scrapingJobs.userId, session.user.id)
      )
    );

  return { success: true };
}

export async function getRecentScrapingActivity(days = 7) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const activity = await db.execute(sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as jobs_created,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(results_count) as total_results
    FROM scraping_jobs
    WHERE user_id = ${session.user.id}
    AND created_at > NOW() - INTERVAL '${sql.raw(days.toString())} days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return activity.rows as unknown as Array<{
    date: string;
    jobs_created: number;
    completed: number;
    failed: number;
    total_results: number;
  }>;
}
