import "dotenv/config";
import { createServer } from "http";
import { spawn } from "child_process";
import { parse } from "url";
import { Socket } from "net";
import next from "next";
import { emailWorker, scrapingWorker } from "./lib/queue";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "7860", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("🚀 Starting Custom Server (Next.js + Workers)...");

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
            const redisProcess = spawn("redis-server", [], {
                stdio: "ignore", // Run in background
                detached: true
            });

            redisProcess.on("error", () => {
                console.warn("⚠️  Could not auto-start 'redis-server'. Ensure it is installed and in your PATH, or use Docker.");
                console.warn("⚠️  Please start Redis manually: 'redis-server'");
            });

            if (redisProcess.pid) {
                console.log(`✅ Started local Redis process (PID: ${redisProcess.pid})`);
                redisProcess.unref();

                process.on("exit", () => {
                    try { process.kill(redisProcess.pid!); } catch { }
                });
            }
        }
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

    // 3. Start Workers
    console.log("👷 Initializing Background Workers...");

    // Workers are instantiated in lib/queue.ts, so importing them is enough to ensure they are "alive"
    // but we can log their status here.
    console.log(`✅ Email Worker ID: ${emailWorker.id}`);
    console.log(`✅ Scraping Worker ID: ${scrapingWorker.id}`);

    // 3. Keep-Alive Mechanism (Hugging Face Free Tier)
    // Pings the server every 14 minutes to prevent sleep
    const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes

    if (process.env.ENABLE_KEEP_ALIVE === "true") {
        console.log("💓 Keep-Alive mechanism enabled");

        const performHealthCheck = async () => {
            try {
                const url = `http://${hostname}:${port}/api/health`;
                console.log(`💓 Sending keep-alive ping to ${url}`);

                const response = await fetch(url);
                const data = await response.json();

                if (data.status === "healthy") {
                    console.log("✅ Keep-alive: Server is healthy");
                } else {
                    console.warn(`⚠️  Keep-alive: Server status is ${data.status}`);
                }
            } catch (error) {
                console.error("❌ Keep-alive ping failed:", error);
            }
        };

        // Initial ping after 30 seconds
        setTimeout(performHealthCheck, 30000);

        // Regular pings
        setInterval(performHealthCheck, KEEP_ALIVE_INTERVAL);
    }

    // Graceful Shutdown
    const shutdown = async () => {
        console.log("🛑 Shutting down server and workers...");
        await emailWorker.close();
        await scrapingWorker.close();
        process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
});
