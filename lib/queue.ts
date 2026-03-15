/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job, Queue, Worker } from "bullmq";
import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import type Redis from "ioredis";

import { db } from "@/db";
import {
  automationWorkflows,
  businesses,
  emailLogs,
  emailTemplates,
  notifications,
  users,
  workflowExecutionLogs,
} from "@/db/schema";
import { interpolateTemplate, sendColdEmail } from "@/lib/email";
import { getRedis } from "@/lib/redis";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import type { ScraperSourceName } from "@/lib/scrapers/types";

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

interface WorkflowJobData {
  workflowId: string;
  userId: string;
  businessId: string;
  executionId: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface QueueWorkers {
  emailWorker: Worker<EmailJobData>;
  scrapingWorker: Worker<ScrapingJobData>;
  workflowWorker: Worker<WorkflowJobData>;
}

let queueConnection: Redis | null = null;
let emailQueueInstance: Queue<EmailJobData> | null = null;
let scrapingQueueInstance: Queue<ScrapingJobData> | null = null;
let workflowQueueInstance: Queue<WorkflowJobData> | null = null;
let workerBundle: QueueWorkers | null = null;

function getQueueConnection(): Redis {
  if (queueConnection) {
    return queueConnection;
  }

  const connection = getRedis();

  if (!connection) {
    throw new Error("Redis/Valkey is required for queue operations.");
  }

  queueConnection = connection;
  return connection;
}

function getEmailQueue() {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue<EmailJobData>("email-outreach", {
      connection: getQueueConnection() as any,
    });
  }

  return emailQueueInstance;
}

function getScrapingQueue() {
  if (!scrapingQueueInstance) {
    scrapingQueueInstance = new Queue<ScrapingJobData>("google-maps-scraping", {
      connection: getQueueConnection() as any,
    });
  }

  return scrapingQueueInstance;
}

function getWorkflowQueue() {
  if (!workflowQueueInstance) {
    workflowQueueInstance = new Queue<WorkflowJobData>("workflow-execution", {
      connection: getQueueConnection() as any,
    });
  }

  return workflowQueueInstance;
}

export async function queueEmail(data: EmailJobData) {
  await getEmailQueue().add("send-email", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

export async function queueScraping(params: ScrapingJobData) {
  await getScrapingQueue().add("scrape-google-maps", params, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  });
}

export async function queueWorkflowExecution(data: WorkflowJobData) {
  await ensureWorkflowExecutionQueued(data);
}

async function ensureWorkflowExecutionQueued(data: WorkflowJobData) {
  const queue = getWorkflowQueue();
  const existingJob = await queue.getJob(data.executionId);

  if (existingJob) {
    return existingJob;
  }

  return queue.add("execute-workflow", data, {
    jobId: data.executionId,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  });
}

async function processEmailJob(job: Job<EmailJobData>) {
  const { userId, businessId, templateId, accessToken } = job.data;

  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) {
      throw new Error("Business not found");
    }

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template) {
      throw new Error("Template not found");
    }

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
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const delay = tomorrow.getTime() - now.getTime() + 60000;

      console.log(
        `Daily email limit reached (${usage.count}/50). Delaying job ${job.id} by ${Math.round(
          delay / 1000 / 60
        )} minutes.`
      );

      await job.moveToDelayed(Date.now() + delay, job.token);
      return { delayed: true, reason: "Daily limit reached" };
    }

    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!sender) {
      throw new Error("Sender not found");
    }

    const [logEntry] = await db
      .insert(emailLogs)
      .values({
        userId,
        businessId: business.id,
        templateId: template.id,
        subject: interpolateTemplate(template.subject, business, sender),
        body: "",
        status: "pending",
        errorMessage: null,
        sentAt: null,
      })
      .returning();

    const trackingDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const pixelUrl = `${trackingDomain}/api/tracking/open?id=${logEntry.id}`;
    const trackingPixel =
      `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

    let finalBody = interpolateTemplate(template.body, business, sender);
    finalBody = finalBody.replace(/href=["']([^"']+)["']/g, (_match, url) => {
      const encodedUrl = encodeURIComponent(url);
      const trackingUrl = `${trackingDomain}/api/tracking/click?id=${logEntry.id}&url=${encodedUrl}`;
      return `href="${trackingUrl}"`;
    });
    finalBody += trackingPixel;

    await db.update(emailLogs).set({ body: finalBody }).where(eq(emailLogs.id, logEntry.id));

    const emailResult = await sendColdEmail(business, template, accessToken, sender);
    const success = emailResult.success;
    const error = emailResult.error;

    await db
      .update(emailLogs)
      .set({
        status: success ? "sent" : "failed",
        errorMessage: error,
        sentAt: success ? new Date() : null,
      })
      .where(eq(emailLogs.id, logEntry.id));

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
}

async function processScrapingJob(job: Job<ScrapingJobData>) {
  const { userId, jobId, keywords, location, sources = ["google-maps"] } = job.data;
  console.log(`Starting scraping job ${job.id} for record ${jobId}`);

  const { scrapingJobs } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { scrapeMultiSource } = await import("./scrapers");

  try {
    let [jobRecord] = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.id, jobId))
      .limit(1);

    if (!jobRecord) {
      throw new Error(`Job ${jobId} not found`);
    }

    await db.update(scrapingJobs).set({ status: "running" }).where(eq(scrapingJobs.id, jobId));

    let totalFound = jobRecord.businessesFound || 0;
    let loopCount = 0;
    const maxLoops = 50;

    while (true) {
      loopCount += 1;

      [jobRecord] = await db
        .select()
        .from(scrapingJobs)
        .where(eq(scrapingJobs.id, jobId))
        .limit(1);

      if (!jobRecord) {
        break;
      }

      if (jobRecord.status === "paused") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      if (jobRecord.status === "failed" || jobRecord.status === "completed") {
        break;
      }

      const jitter = Math.floor(Math.random() * 5000);
      await new Promise((resolve) => setTimeout(resolve, 2000 + jitter));

      const results = await scrapeMultiSource(
        {
          keywords,
          location,
          limit: 20,
          sources,
        },
        userId
      );

      if (results.length > 0) {
        const businessesToInsert = results.map((business) => ({
          ...business,
          userId,
          category: business.category || "Unknown",
          emailStatus: business.emailStatus || null,
        }));

        try {
          await db.insert(businesses).values(businessesToInsert).onConflictDoNothing();
        } catch (error: unknown) {
          console.error(
            "Failed to insert scraped businesses:",
            error instanceof Error ? error.message : String(error)
          );

          await db.insert(businesses).values(businessesToInsert).catch((fallbackError: unknown) => {
            console.error(
              "Fallback insert failed:",
              fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            );
          });
        }

        totalFound += results.length;

        await db
          .update(scrapingJobs)
          .set({ businessesFound: totalFound })
          .where(eq(scrapingJobs.id, jobId));
      }

      if (loopCount >= maxLoops) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await db
      .update(scrapingJobs)
      .set({
        status: "completed",
        businessesFound: totalFound,
        completedAt: new Date(),
      })
      .where(eq(scrapingJobs.id, jobId));

    return { success: true, count: totalFound };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Scraping job ${job.id} failed:`, message);

    const { scrapingJobs } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(scrapingJobs)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(scrapingJobs.id, jobId));

    throw new Error(message);
  }
}

async function processWorkflowJob(job: Job<WorkflowJobData>) {
  const { workflowId, userId, businessId, executionId } = job.data;
  console.log(`Processing workflow job ${job.id} (execution ${executionId})`);

  const { WorkflowExecutor } = await import("./workflow-executor");

  try {
    await db
      .update(workflowExecutionLogs)
      .set({
        status: "running",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutionLogs.id, executionId));

    const workflow = await db.query.automationWorkflows.findFirst({
      where: eq(automationWorkflows.id, workflowId),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });

    if (!business) {
      throw new Error("Business not found");
    }

    const executor = new WorkflowExecutor(workflow.nodes as any, workflow.edges as any, {
      businessId: business.id,
      businessData: business as any,
      variables: {},
      userId,
      workflowId: workflow.id,
    });

    const result = await executor.execute();
    const finalState = executor.getVariables();

    await db
      .update(workflowExecutionLogs)
      .set({
        status: result.success ? "success" : "failed",
        logs: JSON.stringify(result.logs),
        state: finalState,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutionLogs.id, executionId));

    if (!result.success) {
      throw new Error("Workflow execution logic returned failure");
    }

    await db
      .update(automationWorkflows)
      .set({
        lastRunAt: new Date(),
        executionCount: (workflow.executionCount || 0) + 1,
      })
      .where(eq(automationWorkflows.id, workflowId));

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Workflow job ${job.id} failed:`, message);

    await db
      .update(workflowExecutionLogs)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutionLogs.id, executionId));

    throw new Error(message);
  }
}

function attachCommonWorkerListeners<T>(worker: Worker<T>, label: string) {
  worker.on("completed", (job) => {
    console.log(`${label} job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`${label} job ${job?.id} failed:`, err.message);
  });
}

async function attachWorkflowFailureListener(worker: Worker<WorkflowJobData>) {
  worker.on("failed", async (job, err) => {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 0)) {
      return;
    }

    await db.insert(notifications).values({
      userId: job.data.userId,
      title: "Workflow Failure",
      message: `Workflow ${job.data.workflowId} failed after ${job.opts.attempts} attempts. Error: ${err.message}`,
      level: "error",
      category: "workflow",
    });

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, job.data.userId),
      });

      if (user?.phone) {
        await sendWhatsAppMessage({
          to: user.phone,
          text: `Critical alert: workflow ${job.data.executionId} failed. Error: ${err.message}`,
        });
      }
    } catch (whatsAppError) {
      console.error("Failed to send workflow WhatsApp alert:", whatsAppError);
    }
  });
}

function createWorkers(): QueueWorkers {
  const connection = getQueueConnection();

  const emailWorker = new Worker<EmailJobData>("email-outreach", processEmailJob, {
    connection: connection as any,
  });

  const scrapingWorker = new Worker<ScrapingJobData>("google-maps-scraping", processScrapingJob, {
    connection: connection as any,
    concurrency: 5,
  });

  const workflowWorker = new Worker<WorkflowJobData>(
    "workflow-execution",
    processWorkflowJob,
    {
      connection: connection as any,
      concurrency: 10,
    }
  );

  attachCommonWorkerListeners(emailWorker, "Email");
  attachCommonWorkerListeners(scrapingWorker, "Scraping");
  attachCommonWorkerListeners(workflowWorker, "Workflow");
  void attachWorkflowFailureListener(workflowWorker);

  return {
    emailWorker,
    scrapingWorker,
    workflowWorker,
  };
}

async function recoverIncompleteWorkflowExecutions() {
  const recoverableExecutions = await db.query.workflowExecutionLogs.findMany({
    where: and(
      or(
        eq(workflowExecutionLogs.status, "pending"),
        eq(workflowExecutionLogs.status, "running")
      ),
      isNull(workflowExecutionLogs.completedAt)
    ),
    columns: {
      id: true,
      workflowId: true,
      userId: true,
      businessId: true,
      status: true,
    },
  });

  if (recoverableExecutions.length === 0) {
    return 0;
  }

  let recoveredCount = 0;

  for (const execution of recoverableExecutions) {
    if (!execution.businessId) {
      continue;
    }

    await db
      .update(workflowExecutionLogs)
      .set({
        status: "pending",
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutionLogs.id, execution.id));

    await ensureWorkflowExecutionQueued({
      workflowId: execution.workflowId,
      userId: execution.userId,
      businessId: execution.businessId,
      executionId: execution.id,
    });

    recoveredCount += 1;
  }

  console.log(`Recovered ${recoveredCount} incomplete workflow executions from Postgres.`);
  return recoveredCount;
}

async function getQueueSnapshot(queue: Queue<any, any, string>): Promise<QueueStats> {
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}

export async function getQueueStats() {
  try {
    const [emailStats, scrapingStats, workflowStats] = await Promise.all([
      getQueueSnapshot(getEmailQueue()),
      getQueueSnapshot(getScrapingQueue()),
      getQueueSnapshot(getWorkflowQueue()),
    ]);

    return {
      email: emailStats,
      scraping: scrapingStats,
      workflow: workflowStats,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Redis/Valkey is required")) {
      return {
        email: { waiting: 0, active: 0, completed: 0, failed: 0 },
        scraping: { waiting: 0, active: 0, completed: 0, failed: 0 },
        workflow: { waiting: 0, active: 0, completed: 0, failed: 0 },
      };
    }

    throw error;
  }
}

export async function startWorker() {
  if (process.env.START_QUEUE_WORKERS !== "true") {
    throw new Error("Queue workers are disabled in this process.");
  }

  if (!workerBundle) {
    workerBundle = createWorkers();
    await recoverIncompleteWorkflowExecutions();
  }

  return workerBundle;
}
