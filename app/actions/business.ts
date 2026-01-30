"use server";

import { auth } from "@/auth";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { validateCsrfToken } from "@/lib/csrf-server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteBusiness(id: string, csrfToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Validate CSRF token
    const isValidToken = await validateCsrfToken(csrfToken);
    if (!isValidToken) throw new Error("Invalid CSRF token");

    const userId = await getEffectiveUserId(session.user.id);

    await db.delete(businesses).where(
        and(
            eq(businesses.id, id),
            eq(businesses.userId, userId)
        )
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/businesses");
}

export async function bulkDeleteBusinesses(ids: string[], csrfToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Validate CSRF token
    const isValidToken = await validateCsrfToken(csrfToken);
    if (!isValidToken) throw new Error("Invalid CSRF token");

    const userId = await getEffectiveUserId(session.user.id);

    await db.delete(businesses).where(
        and(
            inArray(businesses.id, ids),
            eq(businesses.userId, userId)
        )
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/businesses");
}
