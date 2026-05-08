import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';
/**
 * Database client factory for Cloudflare Workers / Edge Runtime
 * Lazily initializes the client to ensure environment variables are available.
 */
function createDbClient() {
    const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
    if (!url && process.env.NODE_ENV === "production") {
        console.error("[DB Error] TURSO_DATABASE_URL/DATABASE_URL is missing in production environment!");
    }
    // Log masked URL for debugging
    const maskedUrl = url ? (url.includes("libsql://") ? url.split(".")[0] + "..." : "Local/File") : "MISSING";
    console.log(`[DB] Initializing with URL: ${maskedUrl} | Env: ${process.env.NODE_ENV}`);
    const client = createClient({
        url: url || "http://localhost:8080",
        authToken: authToken || "dummy-token",
    });
    return drizzle(client, { schema });
}
// Export the db instance
export const db = createDbClient();
