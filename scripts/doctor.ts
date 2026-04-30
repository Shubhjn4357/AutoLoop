import { existsSync, readFileSync } from "fs";
import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const ciMode = process.argv.includes("--ci");

const envGroups = [
  { label: "Auth secret", keys: ["AUTH_SECRET", "NEXTAUTH_SECRET"] },
  { label: "Google OAuth client", keys: ["AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"] },
  { label: "Google OAuth secret", keys: ["AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"] },
  { label: "Turso database URL", keys: ["TURSO_DATABASE_URL"] },
  { label: "Turso auth token", keys: ["TURSO_AUTH_TOKEN"] },
  { label: "Meta app ID", keys: ["FACEBOOK_CLIENT_ID"] },
  { label: "Meta app secret", keys: ["FACEBOOK_CLIENT_SECRET"] },
  { label: "Meta webhook verify token", keys: ["META_VERIFY_TOKEN"] },
  { label: "Meta webhook app secret", keys: ["META_APP_SECRET"] },
  { label: "Follow-up worker secret", keys: ["AUTOMATION_CRON_SECRET"] },
];

const requiredFiles = [
  "Dockerfile",
  "public/_headers",
  ".github/workflows/main.yml",
];

const requiredScripts = [
  "build",
  "typecheck",
  "lint",
  "test",
  "test:unit",
  "test:components",
  "test:e2e",
  "db:push",
  "db:generate",
  "doctor"
];

function hasAnyEnv(keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]));
}

function printStatus(ok: boolean, message: string) {
  console.log(`${ok ? "PASS" : "WARN"} ${message}`);
}

async function runDoctor() {
  console.log(`AutoLoop Doctor (${ciMode ? "ci" : "strict"})`);

  let failed = false;

  console.log("\nEnvironment");
  for (const group of envGroups) {
    const ok = hasAnyEnv(group.keys);
    printStatus(ok, `${group.label}: ${group.keys.join(" or ")}`);
    if (!ok && !ciMode) {
      failed = true;
    }
  }

  console.log("\nProject files");
  for (const file of requiredFiles) {
    const ok = existsSync(file);
    printStatus(ok, file);
    if (!ok) {
      failed = true;
    }
  }

  console.log("\nPackage scripts");
  const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
    scripts?: Record<string, string>;
  };

  for (const script of requiredScripts) {
    const ok = Boolean(pkg.scripts?.[script]);
    printStatus(ok, `pnpm ${script}`);
    if (!ok) {
      failed = true;
    }
  }

  const shouldPingDatabase =
    !ciMode && Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

  if (shouldPingDatabase) {
    console.log("\nDatabase");
    try {
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });

      await client.execute("SELECT 1;");
      printStatus(true, "Turso connectivity");
    } catch (error) {
      printStatus(false, "Turso connectivity");
      console.error(error instanceof Error ? error.message : error);
      failed = true;
    }
  }

  if (failed) {
    console.error("\nDoctor found blocking issues.");
    process.exit(1);
  }

  console.log("\nDoctor finished cleanly.");
}

runDoctor().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
