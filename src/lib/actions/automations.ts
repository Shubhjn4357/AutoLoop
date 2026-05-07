"use server";

import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
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
  followUpTemplate?: string;
  followUpDelayMinutes: number;
  followUp2Template?: string;
  followUp2DelayMinutes: number;
  requireFollower: boolean;
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

  if (rule.id) {
    // Update existing
    await db.update(automations)
      .set({
        name: rule.name,
        triggerType: rule.triggerType,
        conditionOperator: rule.conditionOperator,
        condition: rule.condition || null,
        targetPostId: rule.targetPostId || null,
        responseTemplate: rule.responseTemplate || null,
        dmTemplate: rule.dmTemplate,
        targetUrl: rule.targetUrl || null,
        followUpTemplate: rule.followUpTemplate || null,
        followUpDelayMinutes: rule.followUpDelayMinutes,
        followUp2Template: rule.followUp2Template || null,
        followUp2DelayMinutes: rule.followUp2DelayMinutes,
        requireFollower: rule.requireFollower,
        aiEnabled: rule.aiEnabled,
        aiPrompt: rule.aiPrompt || null,
        cooldownMinutes: rule.cooldownMinutes,
        maxDailySends: rule.maxDailySends,
        isActive: rule.isActive,
        priority: rule.priority,
        updatedAt: now,
      })
      .where(and(
        eq(automations.id, rule.id),
        eq(automations.userId, session.user.id)
      ));
  } else {
    // Create new
    await db.insert(automations).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: rule.name,
      triggerType: rule.triggerType,
      conditionOperator: rule.conditionOperator,
      condition: rule.condition || null,
      targetPostId: rule.targetPostId || null,
      responseTemplate: rule.responseTemplate || null,
      dmTemplate: rule.dmTemplate,
      targetUrl: rule.targetUrl || null,
      followUpTemplate: rule.followUpTemplate || null,
      followUpDelayMinutes: rule.followUpDelayMinutes,
      followUp2Template: rule.followUp2Template || null,
      followUp2DelayMinutes: rule.followUp2DelayMinutes,
      requireFollower: rule.requireFollower,
      aiEnabled: rule.aiEnabled,
      aiPrompt: rule.aiPrompt || null,
      cooldownMinutes: rule.cooldownMinutes,
      maxDailySends: rule.maxDailySends,
      isActive: rule.isActive,
      priority: rule.priority,
      createdAt: now,
      updatedAt: now,
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
