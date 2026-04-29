import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Avoid breaking Next.js build when env vars are missing in Docker/CI
const url = process.env.TURSO_DATABASE_URL || "file:./dummy.db";

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
