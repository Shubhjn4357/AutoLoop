
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkSettingsTable() {
    try {
        // Check for 'system_settings' table
        const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'system_settings';
    `);

        if (result.rows.length > 0) {
            console.log("✅ 'system_settings' table exists.");
        } else {
            console.error("❌ 'system_settings' table MISSING.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

checkSettingsTable();
