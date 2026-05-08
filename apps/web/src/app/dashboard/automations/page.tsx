import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automations, socialAccounts } from "@/lib/db/schema";
import { QueryToast } from "@/components/dashboard/query-toast";
import { AutomationsSkeleton } from "@/components/dashboard/skeletons";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";
import { SimpleAutomationBuilder } from "./automations-bridge";
import { saveAutomation, deleteAutomation } from "@/lib/actions/automations";

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

  return (
    <div className="space-y-6 max-w-7xl">
      <Suspense fallback={null}>
        <QueryToast />
      </Suspense>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Automations</h1>
        <p className="text-muted-foreground">
          Create simple, powerful automations to engage with your audience automatically.
        </p>
      </div>

      {!account?.externalId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<AutomationsSkeleton />}>
            <SimpleAutomationBuilder
              userId={session.user.id}
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
                linkText: a.linkText || undefined,
                followUpTemplate: a.followUpTemplate || undefined,
                followUpDelayMinutes: a.followUpDelayMinutes ?? 0,
                followUpUrl: a.followUpUrl || undefined,
                followUpUrlText: a.followUpUrlText || undefined,
                followUp2Template: a.followUp2Template || undefined,
                followUp2DelayMinutes: a.followUp2DelayMinutes ?? 1440,
                followUp2Url: a.followUp2Url || undefined,
                followUp2UrlText: a.followUp2UrlText || undefined,
                requireFollower: a.requireFollower ?? false,
                followerGateTemplate: a.followerGateTemplate || undefined,
                followerGateButtonText: a.followerGateButtonText || undefined,
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
