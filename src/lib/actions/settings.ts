"use server";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserSettings(data: {
  name?: string;
  settingsJson?: string;
  generateWebhookToken?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updateData: {
    name?: string;
    settingsJson?: string;
    webhookToken?: string;
  } = {};
  
  if (data.name) updateData.name = data.name;
  if (data.settingsJson) updateData.settingsJson = data.settingsJson;
  if (data.generateWebhookToken) {
    updateData.webhookToken = `al_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard/settings");
  return { success: true, webhookToken: updateData.webhookToken };
}
