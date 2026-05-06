import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

/**
 * Database client factory for Cloudflare Workers / Edge Runtime
 * Lazily initializes the client to ensure environment variables are available.
 */
function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url && process.env.NODE_ENV === "production") {
    console.error("[DB Error] TURSO_DATABASE_URL is missing in production environment!");
  }

  const client = createClient({
    url: url || "http://localhost:8080",
    authToken: authToken || "dummy-token",
  });

  return drizzle(client, { schema });
}

// Export the db instance
export const db = createDbClient();
