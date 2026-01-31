// TypeScript ESLint configuration overrides for necessary 'any' types
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue, Worker, Job } from "bullmq";
import { redis as connection } from "./redis";
import Redis from "ioredis";
import { db } from "@/db";
import { emailLogs, businesses, emailTemplates, users } from "@/db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { interpolateTemplate, sendColdEmail } from "./email";
import type { ScraperSourceName } from "./scrapers/types";

// Ensure we have a valid Redis instance for BullMQ (even if disconnected/null in lib/redis)
const safeConnection = connection || new Redis({
  maxRetriesPerRequest: null,
  lazyConnect: true
});

// Email queue
export const emailQueue = new Queue("email-outreach", { connection: safeConnection as any });

// Scraping queue
export const scrapingQueue = new Queue("google-maps-scraping", { connection: safeConnection as any });

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
      // Check daily limit (50 emails/day)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const [usage] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailLogs)
        .where(
          and(
            eq(emailLogs.userId, userId),
            eq(emailLogs.status, "sent"),
            gte(emailLogs.sentAt, startOfDay),
            lt(emailLogs.sentAt, endOfDay)
          )
        );

      if (usage && usage.count >= 50) {
        // Calculate time until next day
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const delay = tomorrow.getTime() - now.getTime() + 60000; // 1 min buffer

        console.log(`⚠️ Daily email limit reached (${usage.count}/50). Delaying job ${job.id} by ${Math.round(delay / 1000 / 60)} minutes.`);

        await job.moveToDelayed(Date.now() + delay, job.token);
        return { delayed: true, reason: "Daily limit reached" };
      }

      const sender = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!sender) throw new Error("Sender not found");

      // Send emails
      // Send email
      // Log email immediately to get the ID for tracking
      const [logEntry] = await db.insert(emailLogs).values({
        userId,
        businessId: business.id,
        templateId: template.id,
        subject: interpolateTemplate(template.subject, business, sender),
        body: "", // Will update after sending
        status: "pending",
        errorMessage: null,
        sentAt: null,
      }).returning();

      const trackingDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      // Inject Open Tracking Pixel
      const pixelUrl = `${trackingDomain}/api/tracking/open?id=${logEntry.id}`;
      const trackingPixel = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

      let finalBody = interpolateTemplate(template.body, business, sender);

      // Inject Click Tracking (Basic implementation: rewrite hrefs)
      finalBody = finalBody.replace(/href=["']([^"']+)["']/g, (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        const trackingUrl = `${trackingDomain}/api/tracking/click?id=${logEntry.id}&url=${encodedUrl}`;
        return `href="${trackingUrl}"`;
      });

      // Append pixel
      finalBody += trackingPixel;

      // Update body in log
      await db.update(emailLogs).set({ body: finalBody }).where(eq(emailLogs.id, logEntry.id));

      // Rename destructured variables to avoid conflict or use different scope
      const emailResult = await sendColdEmail(
        business,
        template,
        accessToken,
        sender
      );

      const success = emailResult.success;
      const error = emailResult.error;

      // Update log status
      await db.update(emailLogs).set({
        status: success ? "sent" : "failed",
        errorMessage: error,
        sentAt: success ? new Date() : null
      }).where(eq(emailLogs.id, logEntry.id));

      // Update business status
      await db
        .update(businesses)
        .set({
          emailSent: true,
          emailSentAt: new Date(),
          emailStatus: success ? "sent" : "failed",
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, business.id));

      if (!success) {
        throw new Error(error || "Failed to send email");
      }

      return { success: true, businessId };
    } catch (error: unknown) {
      // Log failure
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db.insert(emailLogs).values({
        userId,
        businessId,
        templateId,
        subject: "Cold Outreach",
        body: "Failed to send",
        status: "failed",
        errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
  { connection: safeConnection as any }
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
          } catch (e: unknown) {
            console.error("  ❌ Failed to insert businesses (onConflictDoNothing):", e instanceof Error ? e.message : String(e));
            // Fallback if onConflictDoNothing is not supported by driver or schema setup
            await db.insert(businesses).values(businessesToInsert).catch((err: unknown) => {
              console.error("  ❌ Fallback insert also failed:", err instanceof Error ? err.message : String(err));
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

    } catch (error: unknown) {
      console.error(`❌ Job failed:`, error instanceof Error ? error.message : String(error));
      await db
        .update(scrapingJobs)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(scrapingJobs.id, jobId));
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  },
  {
    connection: safeConnection as any,
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
 * Workflow execution queue
 */
export const workflowQueue = new Queue("workflow-execution", { connection: safeConnection as any });

interface WorkflowJobData {
  workflowId: string;
  userId: string;
  businessId: string;
  executionId: string;
}

/**
 * Add workflow execution to queue
 */
export async function queueWorkflowExecution(data: WorkflowJobData) {
  await workflowQueue.add(
    "execute-workflow",
    data,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    }
  );
}

/**
 * Workflow worker - processes workflow execution jobs
 */
export const workflowWorker = new Worker(
  "workflow-execution",
  async (job: Job<WorkflowJobData>) => {
    const { workflowId, userId, businessId, executionId } = job.data;
    console.log(`\n🚀 Processing workflow job ${job.id} (ExecID: ${executionId})`);

    // Dynamic import to avoid circular dependencies if any
    const { WorkflowExecutor } = await import("./workflow-executor");
    const { automationWorkflows, workflowExecutionLogs } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("@/db");

    try {
      // 1. Fetch Workflow & Business Data
      const workflow = await db.query.automationWorkflows.findFirst({
        where: eq(automationWorkflows.id, workflowId)
      });

      if (!workflow) throw new Error("Workflow not found");

      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId)
      });

      if (!business) throw new Error("Business not found");

      // 2. Instantiate Executor
      // Import types dynamically or assume they are available
      // specific type imports might be needed if strictly typed

      const executor = new WorkflowExecutor(
        workflow.nodes as any,
        workflow.edges as any,
        {
          businessId: business.id,
          businessData: business as any,
          variables: {},
          userId,
          workflowId: workflow.id,
        }
      );

      // 3. Execute
      const result = await executor.execute();
      const finalState = executor.getVariables();

      // 4. Update Status based on result
      await db
        .update(workflowExecutionLogs)
        .set({
          status: result.success ? "success" : "failed",
          logs: JSON.stringify(result.logs),
          state: finalState,
          completedAt: new Date(),
        })
        .where(eq(workflowExecutionLogs.id, executionId));

      if (result.success) {
        // Update Workflow lastRunAt and executionCount
        await db
          .update(automationWorkflows)
          .set({
            lastRunAt: new Date(),
            executionCount: (workflow.executionCount || 0) + 1
          })
          .where(eq(automationWorkflows.id, workflowId));
      } else {
        throw new Error("Workflow execution logic returned failure");
      }

      return { success: true };

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Workflow job ${job.id} failed:`, msg);

      // Update log to failed
      await db
        .update(workflowExecutionLogs)
        .set({
          status: "failed",
          error: msg,
          completedAt: new Date(),
        })
        .where(eq(workflowExecutionLogs.id, executionId));

      throw new Error(msg);
    }
  },
  { connection: safeConnection as any, concurrency: 10 }
);

workflowWorker.on("completed", (job) => {
  console.log(`✅ Workflow job ${job.id} completed`);
});

workflowWorker.on("failed", async (job, err) => {
  console.error(`❌ Workflow job ${job?.id} failed:`, err);

  // Example: Check attempts and notify if max reached
  if (job && job.attemptsMade >= job.opts.attempts!) {
    const { notifications, users } = await import("@/db/schema");
    const { db } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/client");

    // 1. Create In-App Notification
    await db.insert(notifications).values({
      userId: job.data.userId,
      title: "Workflow Complete Failure",
      message: `Workflow ${job.data.workflowId} failed after ${job.opts.attempts} attempts. Error: ${err.message}`,
      level: "error",
      category: "workflow"
    });

    // 2. Send WhatsApp Alert if User has phone number
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, job.data.userId)
      });

      if (user && user.phone) {
        // Using a text message for internal alerts (or use a template if enforced)
        // System alerts usually need a utility template like "alert_notification"
        // For MVP: text
        await sendWhatsAppMessage({
          to: user.phone,
          text: `🚨 Critical Alert: Workflow ${job.data.executionId} FAILED.\nError: ${err.message}`
        });
        console.log(`📱 WhatsApp Alert sent to ${user.phone}`);
      }
    } catch (waError) {
      console.error("Failed to send WhatsApp alert:", waError);
    }
  }
});


/**
 * Queue statistics
 */
export async function getQueueStats() {
  const [emailStats, scrapingStats, workflowStats] = await Promise.all([
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
    Promise.all([
      workflowQueue.getWaitingCount(),
      workflowQueue.getActiveCount(),
      workflowQueue.getCompletedCount(),
      workflowQueue.getFailedCount(),
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
    workflow: workflowStats
  };
}

// Event handlers
emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});



/**
 * Initialize and return queue workers for use in a dedicated worker process.
 * Workers are created on import; this function ensures listeners are attached
 * and returns the worker instances for any external orchestration.
 */
export async function startWorker() {
  try {
    // attach idempotent markers to avoid duplicate listeners
    if (!(emailWorker as any).__started) {
      emailWorker.on("completed", (job) => {
        console.log(`✅ Email job ${job.id} completed`);
      });
      emailWorker.on("failed", (job, err) => {
        console.error(`❌ Email job ${job?.id} failed:`, (err as Error).message ?? String(err));
      });
      (emailWorker as any).__started = true;
    }

    if (!(scrapingWorker as any).__started) {
      scrapingWorker.on("completed", (job) => {
        console.log(`✅ Scraping job ${job.id} completed`);
      });
      scrapingWorker.on("failed", (job, err) => {
        console.error(`❌ Scraping job ${job?.id} failed:`, (err as Error).message ?? String(err));
      });
      (scrapingWorker as any).__started = true;
    }

    if (!(workflowWorker as any).__started) {
      workflowWorker.on("completed", (job) => {
        console.log(`✅ Workflow job ${job.id} completed`);
      });
      workflowWorker.on("failed", (job, err) => {
        console.error(`❌ Workflow job ${job?.id} failed:`, (err as Error).message ?? String(err));
      });
      (workflowWorker as any).__started = true;
    }

    return {
      emailWorker,
      scrapingWorker,
      workflowWorker,
    };
  } catch (err) {
    console.error("Failed to start workers:", err);
    throw err;
  }
}

