/**
 * Server configuration to start background workers
 * This should be called when the server starts
 */

import { startSocialAutomationWorker } from "@/lib/workers/social-automation";

export async function startBackgroundWorkers() {
  console.log("🚀 Starting background workers...");

  try {
    // Start social automation worker
    await startSocialAutomationWorker();

    console.log("✅ All background workers started successfully");
  } catch (error) {
    console.error("❌ Error starting background workers:", error);
  }
}

// Auto-start workers in production
if (process.env.NODE_ENV === "production" || process.env.START_WORKERS === "true") {
  startBackgroundWorkers();
}
