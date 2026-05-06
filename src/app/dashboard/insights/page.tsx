import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { InsightsSkeleton } from "@/components/dashboard/skeletons";
import { InsightsContent } from "./insights-content";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Instagram Insights</h1>
        <p className="text-muted-foreground">
          Real-time performance data from your Instagram Business account.
        </p>
      </div>

      {!account?.externalId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<InsightsSkeleton />}>
          <InsightsContent
            externalId={account.externalId}
            accessToken={account.accessToken!}
              userId={session.user.id}
          />
        </Suspense>
      )}
    </div>
  );
}
