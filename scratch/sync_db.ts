import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../.env") });

import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
  console.log("Syncing database...");
  const migrationPath = path.join(__dirname, "../src/lib/db/migrations/0000_equal_johnny_blaze.sql");
  const content = fs.readFileSync(migrationPath, "utf8");
  const statements = content.split("--> statement-breakpoint");

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    
    console.log("Executing statement...");
    try {
      await db.run(sql.raw(trimmed));
    } catch (err: unknown) {
      const error = err as { message?: string; cause?: { message?: string } };
      if (error.message?.includes("already exists") || error.cause?.message?.includes("already exists")) {
        console.warn("Table/Index already exists, skipping.");
      } else {
        console.error("Error executing statement:", err);
      }
    }
  }
  console.log("Database sync complete.");
}

main().catch(console.error);
