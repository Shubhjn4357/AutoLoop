import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

// Avoid breaking Next.js build when env vars are missing in Docker/CI
const url = process.env.TURSO_DATABASE_URL || "libsql://dummy-db.turso.io";

if (process.env.NODE_ENV === "production") {
  console.log(`[Runtime] DB URL configured: ${process.env.TURSO_DATABASE_URL ? "YES" : "NO (using dummy)"}`);
  console.log(`[Runtime] DB Token configured: ${process.env.TURSO_AUTH_TOKEN ? "YES" : "NO"}`);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || "dummy-token",
});

export const db = drizzle(client, { schema });
