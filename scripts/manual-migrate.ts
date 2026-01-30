
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function manualMigrate() {
  console.log("Starting manual migration...");
  try {
    // 1. Add 'role' column to 'users'
    console.log("Checking 'users.role'...");
    await db.execute(sql`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;
    `);
    console.log("✅ 'users.role' handled.");

    // 2. Create 'system_settings' table
    console.log("Checking 'system_settings' table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" text PRIMARY KEY,
        "feature_flags" jsonb DEFAULT '{"betaFeatures":false,"registration":true,"maintenance":false}'::jsonb NOT NULL,
        "email_config" jsonb DEFAULT '{"dailyLimit":10000,"userRateLimit":50}'::jsonb NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ 'system_settings' table handled.");

    // 3. Handle 'notifications' category/type change if needed
    // The schema says 'category' is required and 'type' is gone/renamed?
    // Let's iterate: check if 'type' exists, rename to 'category' if so.
    console.log("Checking 'notifications.category'...");

    // Check if 'type' column exists
    const typeCol = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'type';
    `);

    // Check if 'category' column exists
    const catCol = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'category';
    `);

    if (typeCol.rows.length > 0 && catCol.rows.length === 0) {
      console.log("Renaming 'type' to 'category' in notifications...");
      await db.execute(sql`ALTER TABLE "notifications" RENAME COLUMN "type" TO "category";`);
    } else if (catCol.rows.length === 0) {
      console.log("Adding 'category' column to notifications...");
      await db.execute(sql`ALTER TABLE "notifications" ADD COLUMN "category" varchar(20) DEFAULT 'system' NOT NULL;`);
    } else {
      console.log("✅ 'notifications.category' already exists.");
    }

    // Check 'level' column existence (it was added/renamed from somewhere?)
    const levelCol = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'level';
    `);

    if (levelCol.rows.length === 0) {
      console.log("Adding 'level' column to notifications...");
      await db.execute(sql`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "level" varchar(10) DEFAULT 'info' NOT NULL;`);
    } else {
      console.log("✅ 'notifications.level' already exists.");
    }

    // 4. Add WhatsApp columns to 'users' table
    console.log("Checking WhatsApp columns in 'users' table...");

    await db.execute(sql`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "whatsapp_business_phone" text,
        ADD COLUMN IF NOT EXISTS "whatsapp_access_token" text,
        ADD COLUMN IF NOT EXISTS "whatsapp_verify_token" text;
    `);
    console.log("✅ WhatsApp columns handled.");

    // 5. Clean up null user_id in notifications
    console.log("Cleaning up invalid notifications...");
    await db.execute(sql`DELETE FROM "notifications" WHERE "user_id" IS NULL;`);
    console.log("✅ Invalid notifications cleaned.");

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

manualMigrate();
