import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { searchIGUser } from "@/lib/instagram/graph";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { usernames } = await req.json();

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return NextResponse.json({ error: "Usernames required" }, { status: 400 });
  }

  const results = [];
  const errors = [];

  for (const username of usernames.slice(0, 50)) {
    try {
      const cleanUsername = username.replace("@", "").trim().toLowerCase();
      if (!cleanUsername) continue;

      const userData = await searchIGUser(
        account.igUserId,
        account.accessToken,
        cleanUsername
      );

      results.push({
        username: cleanUsername,
        found: true,
        data: userData,
      });
    } catch (err) {
      errors.push({
        username,
        error: err instanceof Error ? err.message : "Search failed",
      });
    }
  }

  return NextResponse.json({ results, errors, total: results.length });
}
