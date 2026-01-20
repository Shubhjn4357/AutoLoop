"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { notifications, banners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- Global Notifications ---

export async function sendGlobalNotification(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as "info" | "warning" | "success" || "info";

    if (!title || !message) return { error: "Missing fields" };

    await db.insert(notifications).values({
        title,
        message,
        type,
        // userId: null implies global notification
        userId: null,
    });

    revalidatePath("/dashboard"); // Revalidate user dashboard to show new notif
    return { success: true };
}

// --- Banners ---

export async function createBanner(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    const message = formData.get("message") as string;
    if (!message) return { error: "Message required" };

    // Deactivate other banners if we want only one active? 
    // User didn't specify, but usually marquee is one at a time or list.
    // I'll leave others active unless requested.

    await db.insert(banners).values({
        message,
        isActive: true,
        createdBy: session.user.id,
    });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function toggleBanner(id: string, isActive: boolean) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    await db.update(banners).set({ isActive }).where(eq(banners.id, id));
    revalidatePath("/dashboard");
    revalidatePath("/admin/settings");
    return { success: true };
}

export async function deleteBanner(id: string) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    await db.delete(banners).where(eq(banners.id, id));
    revalidatePath("/admin/settings");
    return { success: true };
}
