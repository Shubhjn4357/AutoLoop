/**
 * Worker initialization file
 * Start the BullMQ workers for background job processing
 * 
 * Run this in a separate process: node workers.js
 */

import { emailWorker, scrapingWorker } from "./lib/queue";

console.log("🚀 Starting BullMQ workers...");
console.log("📧 Email worker: Ready");
console.log("🔍 Scraping worker: Ready");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("⏸️  Stopping workers...");
  await emailWorker.close();
  await scrapingWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("⏸️  Stopping workers...");
  await emailWorker.close();
  await scrapingWorker.close();
  process.exit(0);
});

console.log("✅ Workers are running. Press Ctrl+C to stop.");
