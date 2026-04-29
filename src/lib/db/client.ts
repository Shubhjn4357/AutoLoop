import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

// Avoid breaking Next.js build when env vars are missing in Docker/CI
const url = process.env.TURSO_DATABASE_URL || "libsql://dummy-db.turso.io";

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || "dummy-token",
});

export const db = drizzle(client, { schema });
