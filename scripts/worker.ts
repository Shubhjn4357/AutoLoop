
/**
 * Dedicated Worker Entrypoint for Horizontal Scaling
 * Run this in a separate process/container to offload queue processing from the web server.
 * Usage: npx tsx scripts/worker.ts
 */

import { startWorker } from "@/lib/queue";
import { redis } from "@/lib/redis";

async function main() {
    console.log("🚀 Starting dedicated worker process...");

    if (!redis) {
        console.error("❌ Redis is required for the worker.");
        process.exit(1);
    }

    // Load environment
    console.log(`🔌 Connected to DB and Redis at ${process.env.REDIS_URL}`);

    // Start the queue worker
    // Assuming startWorker is the function that initializes BullMQ workers
    // If queue.ts exports individual workers, we would initialize them here.
    // For this codebase, we import the existing queue initialization logic.

    try {
        await startWorker();
        console.log("✅ Worker started successfully. Listening for jobs...");

        // Self-ping optimization to keep server alive (every 5 minutes)
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:7860";
        console.log(`⏰ Setting up self-ping to ${APP_URL}/api/health every 5 minutes`);

        setInterval(async () => {
            try {
                const healthUrl = `${APP_URL}/api/health`;
                // Use fetch to ping the health endpoint
                // We don't care about the response, just hitting the route
                await fetch(healthUrl);
                // Optional: console.log(`pinged ${healthUrl}`);
            } catch (pingError) {
                console.error("Self-ping failed:", pingError);
            }
        }, 5 * 60 * 1000); // 5 minutes
    } catch (err: unknown) {
        console.error("❌ Failed to start worker:", err);
        process.exit(1);
    }

    // Keep process alive
    process.on('SIGTERM', async () => {
        console.log('🛑 Worker received SIGTERM, shutting down...');
        process.exit(0);
    });
}

main();
