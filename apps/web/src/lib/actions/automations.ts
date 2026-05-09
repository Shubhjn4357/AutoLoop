"use server";

import { db } from "@/lib/db/client";
import { automations, notificationLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq, and, desc } from "drizzle-orm";
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
  console.log(`[Action] Saving automation ${rule.id || 'NEW'}:`, {
    name: rule.name,
    linkText: rule.linkText,
    targetUrl: rule.targetUrl,
    requireFollower: rule.requireFollower,
    fu1: { template: rule.followUpTemplate, delay: rule.followUpDelayMinutes, url: rule.followUpUrl, text: rule.followUpUrlText },
    fu2: { template: rule.followUp2Template, delay: rule.followUp2DelayMinutes, url: rule.followUp2Url, text: rule.followUp2UrlText },
  });

  const payload = {
    name: rule.name?.trim() || "Untitled Automation",
    triggerType: rule.triggerType || "dm",
    conditionOperator: rule.conditionOperator || "contains",
    condition: rule.condition?.trim() || null,
    targetPostId: rule.targetPostId || null,
    responseTemplate: rule.responseTemplate?.trim() || null,
    dmTemplate: rule.dmTemplate?.trim() || "",
    targetUrl: rule.targetUrl?.trim() || null,
    linkText: rule.linkText?.trim() || null,
    followUpTemplate: rule.followUpTemplate?.trim() || null,
    followUpDelayMinutes: Number(rule.followUpDelayMinutes) || 0,
    followUpUrl: rule.followUpUrl?.trim() || null,
    followUpUrlText: rule.followUpUrlText?.trim() || null,
    followUp2Template: rule.followUp2Template?.trim() || null,
    followUp2DelayMinutes: Number(rule.followUp2DelayMinutes) || 1440,
    followUp2Url: rule.followUp2Url?.trim() || null,
    followUp2UrlText: rule.followUp2UrlText?.trim() || null,
    requireFollower: Boolean(rule.requireFollower),
    followerGateTemplate: rule.followerGateTemplate?.trim() || null,
    followerGateButtonText: rule.followerGateButtonText?.trim() || null,
    aiEnabled: Boolean(rule.aiEnabled),
    aiPrompt: rule.aiPrompt?.trim() || null,
    cooldownMinutes: Number(rule.cooldownMinutes) || 5,
    maxDailySends: Number(rule.maxDailySends) || 100,
    isActive: Boolean(rule.isActive),
    priority: Number(rule.priority) || 0,
    updatedAt: now,
  };

  if (rule.id) {
    // Update existing
    const result = await db.update(automations)
      .set(payload)
      .where(and(
        eq(automations.id, rule.id),
        eq(automations.userId, session.user.id)
      ));
    console.log(`[Action] Update result for ${rule.id}:`, result);
  } else {
    // Create new
    const id = crypto.randomUUID();
    await db.insert(automations).values({
      ...payload,
      id,
      userId: session.user.id,
      createdAt: now,
    });
    console.log(`[Action] Created new automation: ${id}`);
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

export async function bindAutomationToPost(automationId: string | null, postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. Clear any existing automation bound to this post
  await db.update(automations)
    .set({ targetPostId: null, updatedAt: new Date() })
    .where(and(
      eq(automations.userId, session.user.id),
      eq(automations.targetPostId, postId)
    ));

  // 2. Bind the new automation if provided
  if (automationId) {
    await db.update(automations)
      .set({ targetPostId: postId, updatedAt: new Date() })
      .where(and(
        eq(automations.id, automationId),
        eq(automations.userId, session.user.id)
      ));
  }

  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/automations");
}
export async function getNotifications(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  return db.query.notificationLogs.findMany({
    where: eq(notificationLogs.userId, session.user.id),
    orderBy: [desc(notificationLogs.createdAt)],
    limit
  });
}
