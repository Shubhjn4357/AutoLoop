"use server";

import { db } from "@/lib/db/client";
import { automations, notificationLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface AutomationRule {
  id?: string;
  name: string;
  triggerType: string;
  conditionOperator: string;
  condition?: string;
  targetPostId?: string | null;
  responseTemplate?: string;
  dmTemplate: string;
  targetUrl?: string;
  linkText?: string;
  followUpTemplate?: string;
  followUpDelayMinutes: number;
  followUpUrl?: string;
  followUpUrlText?: string;
  followUp2Template?: string;
  followUp2DelayMinutes: number;
  followUp2Url?: string;
  followUp2UrlText?: string;
  requireFollower: boolean;
  followerGateTemplate?: string;
  followerGateButtonText?: string;
  aiEnabled: boolean;
  aiPrompt?: string;
  cooldownMinutes: number;
  maxDailySends: number;
  isActive: boolean;
  priority: number;
}

export async function saveAutomation(rule: AutomationRule) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();

  console.log(`[Action] PRE-SAVE Payload for ${rule.id}:`, {
    linkText: rule.linkText,
    fu1Url: rule.followUpUrl,
    fu1Text: rule.followUpUrlText,
    fu2Url: rule.followUp2Url,
    fu2Text: rule.followUp2UrlText
  });

  const payload = {
    name: rule.name || "Untitled Automation",
    triggerType: rule.triggerType || "dm",
    conditionOperator: rule.conditionOperator || "contains",
    condition: rule.condition || null,
    targetPostId: rule.targetPostId || null,
    responseTemplate: rule.responseTemplate || null,
    dmTemplate: rule.dmTemplate || "",
    targetUrl: rule.targetUrl || null,
    linkText: rule.linkText || null,
    followUpTemplate: rule.followUpTemplate || null,
    followUpDelayMinutes: rule.followUpDelayMinutes ?? 0,
    followUpUrl: rule.followUpUrl || null,
    followUpUrlText: rule.followUpUrlText || null,
    followUp2Template: rule.followUp2Template || null,
    followUp2DelayMinutes: rule.followUp2DelayMinutes ?? 1440,
    followUp2Url: rule.followUp2Url || null,
    followUp2UrlText: rule.followUp2UrlText || null,
    requireFollower: Boolean(rule.requireFollower),
    followerGateTemplate: rule.followerGateTemplate || null,
    followerGateButtonText: rule.followerGateButtonText || null,
    aiEnabled: Boolean(rule.aiEnabled),
    aiPrompt: rule.aiPrompt || null,
    cooldownMinutes: rule.cooldownMinutes ?? 5,
    maxDailySends: rule.maxDailySends ?? 100,
    isActive: Boolean(rule.isActive),
    priority: rule.priority ?? 0,
    updatedAt: now,
  };

  if (rule.id) {
    // Update existing
    await db.update(automations)
      .set(payload)
      .where(and(
        eq(automations.id, rule.id),
        eq(automations.userId, session.user.id)
      ));
  } else {
    // Create new
    await db.insert(automations).values({
      ...payload,
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdAt: now,
    });
  }

  revalidatePath("/dashboard/automations");
}

export async function toggleAutomation(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
  if (!automation || automation.userId !== session.user.id) throw new Error("Unauthorized");

  await db.update(automations)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(automations.id, id));

  revalidatePath("/dashboard/automations");
}

export async function deleteAutomation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
  if (!automation || automation.userId !== session.user.id) throw new Error("Unauthorized");

  await db.delete(automations)
    .where(and(
      eq(automations.id, id),
      eq(automations.userId, session.user.id)
    ));

  revalidatePath("/dashboard/automations");
}

export async function deleteNotificationLog(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(notificationLogs)
    .where(and(
      eq(notificationLogs.id, id),
      eq(notificationLogs.userId, session.user.id)
    ));

  revalidatePath("/dashboard/notifications");
}

export async function clearNotificationLogs() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(notificationLogs)
    .where(eq(notificationLogs.userId, session.user.id));

  revalidatePath("/dashboard/notifications");
}
