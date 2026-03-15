/**
 * Dedicated worker runtime.
 * Only the worker process should call these functions.
 */

import { Logger } from "@/lib/logger";
import { startTriggerProcessor } from "@/lib/workflow-triggers";
import { startSocialAutomationWorker, stopSocialAutomationWorker } from "@/lib/workers/social-automation";
import { startScheduledPostWorker, stopScheduledPostWorker } from "@/lib/workers/scheduled-posts";

let started = false;

export async function startBackgroundWorkers() {
  if (started) {
    return;
  }

  started = true;

  Logger.info("Starting background automation services");

  startTriggerProcessor();
  startScheduledPostWorker();

  if (process.env.ENABLE_SOCIAL_POLLING === "true") {
    await startSocialAutomationWorker();
  }

  Logger.info("Background automation services started", {
    socialPolling: process.env.ENABLE_SOCIAL_POLLING === "true",
  });
}

export function stopBackgroundWorkers() {
  stopScheduledPostWorker();

  if (process.env.ENABLE_SOCIAL_POLLING === "true") {
    stopSocialAutomationWorker();
  }

  started = false;
}
