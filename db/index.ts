import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Fallback for build phase where secrets aren't available
const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

// Remove channel_binding parameter which is not supported by Neon serverless
const cleanedUrl = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");

const sql = neon(cleanedUrl);
export const db = drizzle(sql, { schema });
