// TypeScript ESLint configuration overrides for necessary 'any' types
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { db } from "@/db";
import { emailLogs, businesses, emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendColdEmail } from "./email";
import type { ScraperSourceName } from "./scrapers/types";

// Redis connection
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Email queue
export const emailQueue = new Queue("email-outreach", { connection: connection as any });

// Scraping queue
export const scrapingQueue = new Queue("google-maps-scraping", { connection: connection as any });

interface EmailJobData {
  userId: string;
  businessId: string;
  templateId: string;
  accessToken: string;
}

interface ScrapingJobData {
  userId: string;
  jobId: string;
  keywords: string[];
  location: string;
  targetBusinessType: string;
  sources?: ScraperSourceName[];
}

/**
 * Add email to queue
 */
export async function queueEmail(data: EmailJobData) {
  await emailQueue.add(
    "send-email",
    data,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

/**
 * Add scraping job to queue
 */
export async function queueScraping(params: ScrapingJobData) {
  await scrapingQueue.add("scrape-google-maps", params, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  });
}

/**
 * Email worker - processes email sending jobs
 */
export const emailWorker = new Worker(
  "email-outreach",
  async (job: Job<EmailJobData>) => {
    const { userId, businessId, templateId, accessToken } = job.data;

    try {
      // Get business details
      const [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

      if (!business) {
        throw new Error("Business not found");
      }

      // Get template
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      // Send email
      await sendColdEmail(
        business,
        template,
        accessToken
      );

      // Log success
      await db.insert(emailLogs).values({
        userId,
        businessId,
        templateId,
        subject: "Cold Outreach",
        body: "Email sent via workflow",
        status: "sent",
        sentAt: new Date(),
      });

      return { success: true, businessId };
    } catch (error: any) {
      // Log failure
      await db.insert(emailLogs).values({
        userId,
        businessId,
        templateId,
        subject: "Cold Outreach",
        body: "Failed to send",
        status: "failed",
        errorMessage: error.message,
      });

      throw error;
    }
  },
  { connection: connection as any }
);

/**
 * Scraping worker - processes Google Maps and Google Search scraping jobs
 */
export const scrapingWorker = new Worker(
  "google-maps-scraping",
  async (job: Job<ScrapingJobData>) => {
    const { userId, jobId, keywords, location, sources = ["google-maps"] } = job.data;
    console.log(`\n🚀 Starting scraping job: ${job.id}`);
    console.log(`   Job ID: ${jobId}`);

    // Import scraping jobs schema and dependencies
    const { scrapingJobs } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { scrapeMultiSource } = await import("./scrapers");

    try {
      // Find the scraping job
      let [jobRecord] = await db
        .select()
        .from(scrapingJobs)
        .where(eq(scrapingJobs.id, jobId))
        .limit(1);

      if (!jobRecord) throw new Error(`Job ${jobId} not found`);

      // Update to running status
      await db
        .update(scrapingJobs)
        .set({ status: "running" })
        .where(eq(scrapingJobs.id, jobId));

      console.log(`   ✓ Status updated to running`);

      // Indefinite Loop State
      let totalFound = jobRecord.businessesFound || 0;
      let loopCount = 0;
      const MAX_LOOPS = 50; // Safety cap to prevent infinite billing/resource usage for now (user can restart)

      // Indefinite scraping loop
      while (true) {
        loopCount++;

        // 1. Check current status from DB (in case user paused/stopped)
        [jobRecord] = await db
          .select()
          .from(scrapingJobs)
          .where(eq(scrapingJobs.id, jobId))
          .limit(1);

        if (!jobRecord) break; // Should not happen

        // Handle Control Signals
        if (jobRecord.status === "paused") {
          console.log(`   ⏸️ Job paused by user. Waiting...`);
          // Wait for 5 seconds then check again
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        if (jobRecord.status === "failed" || jobRecord.status === "completed") {
          console.log(`   🛑 Job stopped by user (Status: ${jobRecord.status})`);
          break;
        }

        // 2. Perform Scraping
        console.log(`   🔄 Loop ${loopCount}: Scraping...`);

        // Add random jitter to avoid patterns
        const jitter = Math.floor(Math.random() * 5000);
        await new Promise(resolve => setTimeout(resolve, 2000 + jitter));

        const results = await scrapeMultiSource(
          {
            keywords, // Improvement: Rotate keywords or add pagination in future
            location,
            limit: 20, // Smaller batch per loop
            sources
          },
          userId
        );

        // 3. Save Results
        if (results.length > 0) {
          console.log(`   💾 Saving ${results.length} businesses...`);

          // Map results to match DB schema (add userId, ensure category)
          const businessesToInsert = results.map(b => ({
            ...b,
            userId,
            category: b.category || "Unknown",
            emailStatus: b.emailStatus || null,
          }));

          // Use INSERT ON CONFLICT DO NOTHING approach
          try {
            await db.insert(businesses).values(businessesToInsert).onConflictDoNothing();
          } catch (e: any) {
            console.error("  ❌ Failed to insert businesses (onConflictDoNothing):", e.message);
            // Fallback if onConflictDoNothing is not supported by driver or schema setup
            await db.insert(businesses).values(businessesToInsert).catch((err) => {
              console.error("  ❌ Fallback insert also failed:", err.message);
            });
          }

          totalFound += results.length;

          // Update progress
          await db
            .update(scrapingJobs)
            .set({
              businessesFound: totalFound
            })
            .where(eq(scrapingJobs.id, jobId));
        }

        // Break if we hit safety limit
        if (loopCount >= MAX_LOOPS) {
          console.log(`   ⚠️ Reached safety limit of ${MAX_LOOPS} loops. Finishing.`);
          break;
        }

        // Yield control briefly
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Final completion update
      await db
        .update(scrapingJobs)
        .set({
          status: "completed",
          businessesFound: totalFound,
          completedAt: new Date(),
        })
        .where(eq(scrapingJobs.id, jobId));

      console.log(`✅ Scraping completed: ${totalFound} total businesses found`);
      return { success: true, count: totalFound };

    } catch (error: any) {
      console.error(`❌ Job failed:`, error);
      await db
        .update(scrapingJobs)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(scrapingJobs.id, jobId));
      throw error;
    }
  },
  {
    connection: connection as any,
    concurrency: 5 // Allow 5 concurrent jobs
  }
);

// Event listeners for scraping worker
scrapingWorker.on("completed", (job) => {
  console.log(`✅ Scraping job ${job.id} completed`);
});

scrapingWorker.on("failed", (job, err) => {
  console.error(`❌ Scraping job ${job?.id} failed:`, err);
});

/**
 * Queue statistics
 */
export async function getQueueStats() {
  const [emailStats, scrapingStats] = await Promise.all([
    Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]).then(([waiting, active, completed, failed]) => ({
      waiting,
      active,
      completed,
      failed,
    })),
    Promise.all([
      scrapingQueue.getWaitingCount(),
      scrapingQueue.getActiveCount(),
      scrapingQueue.getCompletedCount(),
      scrapingQueue.getFailedCount(),
    ]).then(([waiting, active, completed, failed]) => ({
      waiting,
      active,
      completed,
      failed,
    })),
  ]);

  return {
    email: emailStats,
    scraping: scrapingStats,
  };
}

// Event handlers
emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});
