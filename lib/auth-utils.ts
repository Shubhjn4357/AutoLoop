import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves the effective User ID for the current session.
 * If the user is the hardcoded "admin-user" from credentials auth,
 * it attempts to resolve their real database ID via email.
 */
export async function getEffectiveUserId(sessionUserId: string): Promise<string> {
    if (sessionUserId === "admin-user") {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const user = await db.query.users.findFirst({
                where: eq(users.email, adminEmail)
            });
            if (user) {
                return user.id;
            }
        }
    }
    return sessionUserId;
}
