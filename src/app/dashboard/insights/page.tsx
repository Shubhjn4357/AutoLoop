import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { InsightsSkeleton } from "@/components/dashboard/skeletons";
import { InsightsContent } from "./insights-content";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Instagram Insights</h1>
        <p className="text-muted-foreground">
          Real-time performance data from your Instagram Business account.
        </p>
      </div>

      {!account?.igUserId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<InsightsSkeleton />}>
          <InsightsContent
            igUserId={account.igUserId}
            accessToken={account.accessToken!}
          />
        </Suspense>
      )}
    </div>
  );
}
