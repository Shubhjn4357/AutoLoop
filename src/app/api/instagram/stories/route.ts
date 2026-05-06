import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchIGStories } from "@/lib/instagram/graph";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  if (!account?.externalId || !account?.accessToken) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  try {
    const stories = await fetchIGStories(account.externalId, account.accessToken);
    return NextResponse.json({ data: stories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/instagram/stories]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
