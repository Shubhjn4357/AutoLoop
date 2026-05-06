import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fuzzySearchIGUsers, searchIGUser } from "@/lib/instagram/graph";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  if (!account?.accessToken || !account.igUserId) {
    return NextResponse.json(
      { error: "Instagram account not connected" },
      { status: 400 }
    );
  }

  try {
    // First try exact match business discovery for the query
    let exactMatch = null;
    try {
      exactMatch = await searchIGUser(
        account.igUserId,
        account.accessToken,
        query.toLowerCase()
      );
    } catch {
      // Exact match not found, that's ok
    }

    // Get fuzzy results from hashtag search
    const fuzzyResults = await fuzzySearchIGUsers(
      account.igUserId,
      account.accessToken,
      query.toLowerCase()
    );

    // Combine results
    const results = {
      exactMatch,
      fuzzyMatches: fuzzyResults.filter(
        (r) => !exactMatch || r.username.toLowerCase() !== exactMatch.username.toLowerCase()
      ),
      query,
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("[SearchFuzzy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
