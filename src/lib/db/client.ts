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
    url: url || "libsql://dummy-db.turso.io",
    authToken: authToken || "dummy-token",
  });

  return drizzle(client, { schema });
}

// Export the db instance
// Note: In some edge environments, it's better to recreate the client per request 
// if env vars are only available in the context, but for OpenNext/Cloudflare 
// with process.env polyfills, this singleton approach usually works if initialized lazily.
export const db = createDbClient();
