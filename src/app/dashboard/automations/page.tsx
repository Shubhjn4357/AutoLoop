export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automations, instagramAccounts } from "@/lib/db/schema";
import { isConditionOperator } from "@/lib/automation/rules";
import { QueryToast } from "@/components/dashboard/query-toast";
import { AutomationsSkeleton } from "@/components/dashboard/skeletons";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";
import { AutomationsWorkspace } from "./automations-workspace";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [account, userAutomations] = await Promise.all([
    db.query.instagramAccounts.findFirst({
      where: eq(instagramAccounts.userId, session.user.id),
    }),
    db.query.automations.findMany({
      where: eq(automations.userId, session.user.id),
      orderBy: (automation, { desc }) => [desc(automation.createdAt)],
    }),
  ]);

  // Server Actions
  async function createAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const triggerType = String(formData.get("triggerType") ?? "dm").trim();
    const conditionOperatorRaw = String(formData.get("conditionOperator") ?? "contains");
    const conditionOperator = isConditionOperator(conditionOperatorRaw) ? conditionOperatorRaw : "contains";
    const condition = String(formData.get("condition") ?? "").trim();
    const responseTemplate = String(formData.get("responseTemplate") ?? "").trim();
    const followUpTemplate = String(formData.get("followUpTemplate") ?? "").trim();
    const followUpDelayMinutes = Math.max(0, Number(formData.get("followUpDelayMinutes") ?? 0));
    const targetPostId = String(formData.get("targetPostId") ?? "").trim();

    if (!name || !responseTemplate) redirect("/dashboard/automations?error=invalid_automation");

    const flowJson = JSON.stringify({
      targetPostId: targetPostId || null,
      triggerType,
    });

    if (id) {
      // Update existing
      await db.update(automations).set({
        name,
        triggerType,
        conditionOperator,
        condition,
        responseTemplate,
        followUpTemplate: followUpTemplate || null,
        followUpDelayMinutes,
        requireFollower: formData.get("requireFollower") === "true",
        flowJson,
        updatedAt: new Date(),
      }).where(eq(automations.id, id));
      
      revalidatePath("/dashboard/automations");
      redirect("/dashboard/automations?updated=1");
    } else {
      // Insert new
      await db.insert(automations).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name,
        triggerType: triggerType || "dm",
        conditionOperator,
        condition,
        responseTemplate,
        followUpTemplate: followUpTemplate || null,
        followUpDelayMinutes,
        requireFollower: formData.get("requireFollower") === "true",
        flowJson,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      revalidatePath("/dashboard/automations");
      redirect("/dashboard/automations?created=1");
    }
  }

  async function toggleAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const id = String(formData.get("id") ?? "");
    const isActive = formData.get("isActive") === "true";
    const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
    if (!automation || automation.userId !== session.user.id) redirect("/dashboard/automations?error=invalid_automation");
    await db.update(automations).set({ isActive, updatedAt: new Date() }).where(eq(automations.id, id));
    revalidatePath("/dashboard/automations");
    redirect("/dashboard/automations?updated=1");
  }

  async function deleteAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const id = String(formData.get("id") ?? "");
    const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
    if (!automation || automation.userId !== session.user.id) redirect("/dashboard/automations?error=invalid_automation");
    await db.delete(automations).where(eq(automations.id, id));
    revalidatePath("/dashboard/automations");
    redirect("/dashboard/automations?deleted=1");
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <Suspense fallback={null}>
        <QueryToast />
      </Suspense>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
        <p className="text-muted-foreground">
          Select a post or story, choose your trigger type, and configure your automated responses.
        </p>
      </div>

      {!account?.igUserId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<AutomationsSkeleton />}>
          <AutomationsWorkspace
            igUserId={account.igUserId}
            accessToken={account.accessToken!}
            existingAutomations={userAutomations}
            createAutomationAction={createAutomationAction}
            toggleAutomationAction={toggleAutomationAction}
            deleteAutomationAction={deleteAutomationAction}
          />
        </Suspense>
      )}
    </div>
  );
}
