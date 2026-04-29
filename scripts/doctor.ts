import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

async function runDoctor() {
  console.log("🩺 AutoLoop Doctor - Running system diagnostics...\n");

  const envs = [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "FACEBOOK_CLIENT_ID",
    "FACEBOOK_CLIENT_SECRET",
  ];

  let envPassed = true;
  for (const env of envs) {
    if (!process.env[env]) {
      console.error(`❌ Missing .env variable: ${env}`);
      envPassed = false;
    } else {
      console.log(`✅ Found: ${env}`);
    }
  }

  if (!envPassed) {
    console.error("\n❌ Environment variable check failed. Please populate .env.");
    process.exit(1);
  }

  console.log("\n📡 Pinging Turso Database...");
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    // Test query
    await client.execute("SELECT 1;");
    console.log("✅ Database connectivity looks good.");
  } catch (err: any) {
    console.error("❌ Database connection failed. Are your Turso credentials correct?");
    console.error(err.message);
    process.exit(1);
  }

  console.log("\n🎉 All systems go! You are ready to run AutoLoop.");
  process.exit(0);
}

runDoctor();
