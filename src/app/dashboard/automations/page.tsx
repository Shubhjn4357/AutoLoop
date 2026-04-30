import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { AutomationBuilder } from "@/components/automation/automation-builder";
import { QueryToast } from "@/components/dashboard/query-toast";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { isConditionOperator } from "@/lib/automation/rules";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userAutomations = await db.query.automations.findMany({
    where: eq(automations.userId, session.user.id),
    orderBy: (automation, { desc }) => [desc(automation.createdAt)],
  });

  async function createAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const name = String(formData.get("name") ?? "").trim();
    const conditionOperatorRaw = String(formData.get("conditionOperator") ?? "contains");
    const conditionOperator = isConditionOperator(conditionOperatorRaw)
      ? conditionOperatorRaw
      : "contains";
    const condition = String(formData.get("condition") ?? "").trim();
    const responseTemplate = String(formData.get("responseTemplate") ?? "").trim();
    const followUpTemplate = String(formData.get("followUpTemplate") ?? "").trim();
    const followUpDelayMinutes = Math.max(
      0,
      Number(formData.get("followUpDelayMinutes") ?? 0)
    );
    const flowJson = String(formData.get("flowJson") ?? "[]");

    if (!name || !responseTemplate) {
      redirect("/dashboard/automations?error=invalid_automation");
    }

    await db.insert(automations).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      triggerType: "keyword",
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

  async function toggleAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const id = String(formData.get("id") ?? "");
    const isActive = formData.get("isActive") === "true";

    const automation = await db.query.automations.findFirst({
      where: eq(automations.id, id),
    });

    if (!automation || automation.userId !== session.user.id) {
      redirect("/dashboard/automations?error=invalid_automation");
    }

    await db
      .update(automations)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(automations.id, id));

    revalidatePath("/dashboard/automations");
    redirect("/dashboard/automations?updated=1");
  }

  async function deleteAutomationAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const id = String(formData.get("id") ?? "");
    const automation = await db.query.automations.findFirst({
      where: eq(automations.id, id),
    });

    if (!automation || automation.userId !== session.user.id) {
      redirect("/dashboard/automations?error=invalid_automation");
    }

    await db.delete(automations).where(eq(automations.id, id));

    revalidatePath("/dashboard/automations");
    redirect("/dashboard/automations?deleted=1");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <Suspense fallback={null}>
        <QueryToast />
      </Suspense>
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Automations</h2>
        <p className="text-muted-foreground">
          Build real webhook-driven Instagram replies, conditions, and queued follow-ups.
        </p>
      </div>
      <AutomationBuilder
        automations={userAutomations}
        createAutomationAction={createAutomationAction}
        toggleAutomationAction={toggleAutomationAction}
        deleteAutomationAction={deleteAutomationAction}
      />
    </div>
  );
}

