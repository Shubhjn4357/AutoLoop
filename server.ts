import "dotenv/config";

import { createServer } from "http";
import next from "next";
import { parse } from "url";

import { validateEnvironmentVariables } from "./lib/validate-env";

process.on("uncaughtException", (err) => {
  if (err.message && err.message.includes("frame list")) {
    return;
  }

  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "7860", 10);

console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Server] Is Dev Mode: ${dev}`);
console.log("Starting AutoLoop web server...");

validateEnvironmentVariables();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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
});
