import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SearchResults } from "./search-results";
import { NoConnectionBanner } from "@/components/dashboard/no-connection-banner";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q: query } = await searchParams;

  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Business Discovery</h1>
        <p className="text-muted-foreground">
          Discover insights and media from any Instagram Business or Creator profile.
        </p>
      </div>

      {!account?.igUserId ? (
        <NoConnectionBanner />
      ) : (
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted/40 rounded-3xl" />}>
          <SearchResults 
            query={query || ""} 
            igUserId={account.igUserId} 
            accessToken={account.accessToken!} 
          />
        </Suspense>
      )}
    </div>
  );
}
