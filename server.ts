import "dotenv/config";
import { createServer } from "http";
import { spawn } from "child_process";
import { parse } from "url";
import { Socket } from "net";
import next from "next";
import { validateEnvironmentVariables } from "./lib/validate-env";

// Ignore "frame list" errors (often from ws/zlib in dev environments)
process.on("uncaughtException", (err) => {
    if (err.message && err.message.includes("frame list")) {
        // Safe to ignore
        return;
    }
    console.error("Uncaught Exception:", err);
    process.exit(1);
});

const dev = process.env.NODE_ENV !== "production";
console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Server] Is Dev Mode: ${dev}`);

const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "7860", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Trigger processor import - also dynamic later? No, this one is fine but safer to move inside
// import { startTriggerProcessor } from "./lib/workflow-triggers";

console.log("🚀 Starting Custom Server (Next.js + Workers)...");

validateEnvironmentVariables();

app.prepare().then(async () => {
    // 1. Try to start Local Redis (if available and not connecting to external)
    // Default to localhost if REDIS_URL is not set
    const useLocalRedis = !process.env.REDIS_URL || process.env.REDIS_URL.includes("localhost") || process.env.REDIS_URL.includes("127.0.0.1");

    if (useLocalRedis) {
        // Force the env var so the app connects to it securely
        if (!process.env.REDIS_URL) {
            process.env.REDIS_URL = "redis://localhost:6379";
        }

        console.log(`🔄 Checking for local Redis on ${process.env.REDIS_URL}...`);

        // Check if Redis is already running
        const isRedisRunning = await new Promise<boolean>((resolve) => {
            const client = new Socket();
            const redisUrl = new URL(process.env.REDIS_URL!);
            const port = parseInt(redisUrl.port || "6379");
            const host = redisUrl.hostname || "localhost";

            client.connect(port, host, () => {
                client.end();
                resolve(true);
            });

            client.on("error", () => {
                resolve(false);
            });
        });

        if (isRedisRunning) {
            console.log("✅ Local Redis service detected. Skipping auto-spawn.");
        } else {
            console.log(`🔄 Attempting to start local Redis server...`);
            try {
            // Check if redis-server is in PATH (simple spawn attempt)
                const redisProcess = spawn("redis-server", [], {
                    stdio: "ignore", // Run in background
                    detached: true,
                    shell: true // Try with shell=true for better window path handling
                });

                redisProcess.on("error", (err) => {
                    console.warn(`⚠️  Could not auto-start 'redis-server': ${err.message}`);
                    console.warn("⚠️  App will proceed, but background jobs may fail if Redis is not running.");
                });

                if (redisProcess.pid) {
                    console.log(`✅ Started local Redis process (PID: ${redisProcess.pid})`);
                    redisProcess.unref();

                    process.on("exit", () => {
                        try { process.kill(redisProcess.pid!); } catch { }
                    });
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (spawnError) {
                console.warn("⚠️  Failed to spawn redis-server. Make sure it is installed.");
            }
        }
    }

    // Dynamic Import of Workers/Triggers AFTER Redis env/process is handled
    console.log("👷 Initializing Background Workers...");

    // Start Triggers
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_TRIGGERS === "true") {
        import("./lib/workflow-triggers").then(({ startTriggerProcessor }) => {
            startTriggerProcessor();
        });
    }

    // Start Workers
    try {
        const { emailWorker, scrapingWorker } = await import("./lib/queue");
        console.log(`✅ Email Worker ID: ${emailWorker.id}`);
        console.log(`✅ Scraping Worker ID: ${scrapingWorker.id}`);

        // Graceful Shutdown
        const shutdown = async () => {
            console.log("🛑 Shutting down server and workers...");
            await emailWorker.close();
            await scrapingWorker.close();
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

    } catch (e) {
        console.error("❌ Failed to initialize workers (Redis likely missing):", e);
    // Do not crash server, just run without workers
    }

    // 2. Start HTTP Server
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    })
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });

    // 3. Keep-Alive Mechanism
    const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes

    if (process.env.ENABLE_KEEP_ALIVE === "true") {
        console.log("💓 Keep-Alive mechanism enabled");

        const performHealthCheck = async () => {
            try {
                const url = `http://${hostname}:${port}/api/health`;
                // console.log(`💓 Sending keep-alive ping to ${url}`);
                const response = await fetch(url);
                await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // Silent catch
            }
        };

        setTimeout(performHealthCheck, 30000);
        setInterval(performHealthCheck, KEEP_ALIVE_INTERVAL);
    }
});
