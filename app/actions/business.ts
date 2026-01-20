"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteBusiness(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.delete(businesses).where(
        and(
            eq(businesses.id, id),
            eq(businesses.userId, session.user.id)
        )
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/businesses");
}

export async function bulkDeleteBusinesses(ids: string[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.delete(businesses).where(
        and(
            inArray(businesses.id, ids),
            eq(businesses.userId, session.user.id)
        )
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/businesses");
}
