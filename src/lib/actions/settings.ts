"use server";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface NotificationPrefs {
  automationTriggered: boolean;
  connectionAlerts: boolean;
  weeklyDigest: boolean;
}

function getDefaultPrefs(): NotificationPrefs {
  return {
    automationTriggered: true,
    connectionAlerts: true,
    weeklyDigest: true,
  };
}

export function parseSettingsJson(json: string | null | undefined) {
  try {
    return JSON.parse(json ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getNotificationPrefs(json: string | null | undefined): NotificationPrefs {
  const settings = parseSettingsJson(json);
  const prefs = (settings.notifications ?? {}) as Partial<NotificationPrefs>;
  return { ...getDefaultPrefs(), ...prefs };
}

export async function updateUserSettings(data: {
  name?: string;
  settingsJson?: string;
  generateWebhookToken?: boolean;
  notificationPrefs?: NotificationPrefs;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const currentSettings = parseSettingsJson(existing?.settingsJson);

  const updateData: {
    name?: string;
    settingsJson?: string;
    webhookToken?: string;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.generateWebhookToken) {
    updateData.webhookToken = `al_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  if (data.notificationPrefs) {
    currentSettings.notifications = data.notificationPrefs;
    updateData.settingsJson = JSON.stringify(currentSettings);
  }

  if (data.settingsJson) {
    updateData.settingsJson = data.settingsJson;
  }

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard/settings");
  return { success: true, webhookToken: updateData.webhookToken };
}
