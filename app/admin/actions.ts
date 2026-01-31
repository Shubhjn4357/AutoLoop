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
    const level = (formData.get("type") as "info" | "warning" | "success") || "info";

    if (!title || !message) return { error: "Missing fields" };

    try {
        const allUsers = await db.query.users.findMany({
            columns: { id: true }
        });

        if (allUsers.length > 0) {
            const notificationsData = allUsers.map(user => ({
                userId: user.id,
                title,
                message,
                category: "system",
                level,
            }));

            await db.insert(notifications).values(notificationsData);
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to send global notifications:", error);
        return { error: "Failed to send notifications" };
    }
}

// --- Banners ---

export async function createBanner(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") throw new Error("Unauthorized");

    const message = formData.get("message") as string;
    if (!message) return { error: "Message required" };

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
