import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts, automations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MediaGridSkeleton } from "@/components/dashboard/skeletons";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";
import { ContentDashboard } from "./content-dashboard";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [account, userAutomations] = await Promise.all([
    db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.userId, session.user.id),
    }),
    db.query.automations.findMany({
      where: eq(automations.userId, session.user.id),
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Content Manager</h1>
        <p className="text-muted-foreground">
          View, create, and bind automation rules to your Instagram posts.
        </p>
      </div>

      {!account?.externalId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<MediaGridSkeleton />}>
          <ContentDashboard
            externalId={account.externalId}
            accessToken={account.accessToken!}
            automations={userAutomations}
            userId={session.user.id}
          />
        </Suspense>
      )}
    </div>
  );
}
