/**
 * Test Automation Worker Status
 * Verifies all background workers are functioning correctly
 */

import { socialAutomationWorker } from "@/lib/workers/social-automation";

export interface WorkerStatus {
  name: string;
  status: "running" | "stopped" | "error";
  lastCheck?: Date;
  error?: string;
}

/**
 * Check all worker statuses
 */
export async function checkAllWorkers(): Promise<WorkerStatus[]> {
  const statuses: WorkerStatus[] = [];

  // Check Social Automation Worker
  try {
    const socialWorker = socialAutomationWorker as unknown as {
      isRunning: boolean;
      lastCheck?: Date;
    };

    statuses.push({
      name: "Social Automation Worker",
      status: socialWorker.isRunning ? "running" : "stopped",
      lastCheck: socialWorker.lastCheck,
    });
  } catch (error) {
    statuses.push({
      name: "Social Automation Worker",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return statuses;
}

/**
 * Verify worker health
 */
export async function verifyWorkerHealth(): Promise<{
  healthy: boolean;
  workers: WorkerStatus[];
  message: string;
}> {
  const workers = await checkAllWorkers();
  const runningWorkers = workers.filter((w) => w.status === "running");
  const healthy = runningWorkers.length > 0;

  return {
    healthy,
    workers,
    message: healthy
      ? `${runningWorkers.length} worker(s) running successfully`
      : "No workers are currently running",
  };
}
