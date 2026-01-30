
import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    // Check for 'role' column in 'users' table
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role';
    `);

    if (result.rows.length > 0) {
      console.log("✅ 'role' column exists in 'users' table.");
    } else {
      console.error("❌ 'role' column MISSING in 'users' table.");
    }

    // Check 'notifications' table columns
    const notifResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications';
    `);
    
    console.log("Notifications columns:", notifResult.rows.map(r => r.column_name));

    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    process.exit(1);
  }
}

checkSchema();
