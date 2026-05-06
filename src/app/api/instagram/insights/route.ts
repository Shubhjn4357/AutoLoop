import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchIGInsights } from "@/lib/instagram/graph";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "day") as "day" | "week" | "days_28";

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  if (!account?.externalId || !account?.accessToken) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  try {
    const metrics = await fetchIGInsights(
      account.externalId,
      account.accessToken,
      ["reach", "profile_views", "impressions"],
      period
    );
    return NextResponse.json({ data: metrics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/instagram/insights]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
