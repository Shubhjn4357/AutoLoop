"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Admin Bulk Delete (Any user)
export async function adminBulkDeleteBusinesses(ids: string[]) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    await db.delete(businesses).where(inArray(businesses.id, ids));
    revalidatePath("/admin/businesses");
}
