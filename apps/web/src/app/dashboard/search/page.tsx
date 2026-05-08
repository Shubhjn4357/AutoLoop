import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SearchResults } from "./search-bridge";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q: query } = await searchParams;

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Business Discovery</h1>
        <p className="text-muted-foreground">
          Discover insights and media from any Instagram Business or Creator profile.
        </p>
      </div>

      {!account?.externalId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted/40 rounded-3xl" />}>
          <SearchResults 
            query={query || ""} 
            userId={session.user.id}
          />
        </Suspense>
      )}
    </div>
  );
}
