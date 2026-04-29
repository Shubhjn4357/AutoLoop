import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

async function run() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  
  const tables = ['users', 'accounts', 'instagram_accounts', 'automations', 'messages', 'user', 'account', 'session', 'verificationToken'];
  
  for (const table of tables) {
    try {
      await client.execute(`DROP TABLE IF EXISTS ${table};`);
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.log(`Failed to drop ${table}`, e);
    }
  }
}

run();
