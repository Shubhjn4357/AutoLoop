/**
 * Dedicated worker entrypoint.
 * Run this in a separate process/container to handle queue jobs and background automation.
 */

process.env.START_QUEUE_WORKERS = "true";

async function main() {
  const { connectRedis } = await import("@/lib/redis");

  console.log("Starting dedicated worker process...");

  const redis = await connectRedis();

  if (!redis) {
    console.error("Redis/Valkey is required for the worker process.");
    process.exit(1);
  }

  try {
    await redis.ping();
  } catch (error) {
    console.error("Queue backend is unreachable:", error);
    process.exit(1);
  }

  const { startWorker } = await import("@/lib/queue");
  const { startBackgroundWorkers, stopBackgroundWorkers } = await import("@/lib/workers");

  try {
    const workers = await startWorker();
    await startBackgroundWorkers();

    console.log("Worker process is online.");

    const shutdown = async () => {
      console.log("Stopping worker process...");
      stopBackgroundWorkers();
      await workers.emailWorker.close();
      await workers.scrapingWorker.close();
      await workers.workflowWorker.close();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Worker bootstrap failed:", error);
  process.exit(1);
});
