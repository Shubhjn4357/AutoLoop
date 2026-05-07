import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automations, socialAccounts } from "@/lib/db/schema";
import { QueryToast } from "@/components/dashboard/query-toast";
import { AutomationsSkeleton } from "@/components/dashboard/skeletons";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";
import { SimpleAutomationBuilder } from "./automations-bridge";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [account, userAutomations] = await Promise.all([
    db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.userId, session.user.id),
    }),
    db.query.automations.findMany({
      where: eq(automations.userId, session.user.id),
      orderBy: (automation, { desc }) => [desc(automation.createdAt)],
    }),
  ]);

  // Server Actions
  async function saveAutomation(rule: {
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
  }) {
    "use server";

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

  async function deleteAutomation(id: string) {
    "use server";

    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.delete(automations)
      .where(and(
        eq(automations.id, id),
        eq(automations.userId, session.user.id)
      ));

    revalidatePath("/dashboard/automations");
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <Suspense fallback={null}>
        <QueryToast />
      </Suspense>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
        <p className="text-muted-foreground">
          Create simple, powerful automations to engage with your audience automatically.
        </p>
      </div>

      {!account?.externalId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<AutomationsSkeleton />}>
            <SimpleAutomationBuilder
              existingRules={userAutomations.map(a => ({
                id: a.id,
                name: a.name,
                triggerType: a.triggerType,
                conditionOperator: a.conditionOperator,
                condition: a.condition || undefined,
                targetPostId: a.targetPostId || undefined,
                responseTemplate: a.responseTemplate || undefined,
                dmTemplate: a.dmTemplate,
                targetUrl: a.targetUrl || undefined,
                followUpTemplate: a.followUpTemplate || undefined,
                followUpDelayMinutes: a.followUpDelayMinutes ?? 60,
                followUp2Template: a.followUp2Template || undefined,
                followUp2DelayMinutes: a.followUp2DelayMinutes ?? 1440,
                requireFollower: a.requireFollower ?? false,
                aiEnabled: a.aiEnabled ?? false,
                aiPrompt: a.aiPrompt || undefined,
                cooldownMinutes: a.cooldownMinutes ?? 5,
                maxDailySends: a.maxDailySends ?? 100,
                isActive: a.isActive ?? false,
                priority: a.priority ?? 0,
              }))}
              onSave={saveAutomation}
              onDelete={deleteAutomation}
          />
        </Suspense>
      )}
    </div>
  );
}
