import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automationMetrics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const automationId = searchParams.get("automationId");

  try {
    if (automationId) {
      const metric = await db.query.automationMetrics.findFirst({
        where: eq(automationMetrics.automationId, automationId),
      });
      return NextResponse.json(metric ?? { sendCount: 0, replyCount: 0 });
    }

    const allMetrics = await db.query.automationMetrics.findMany({
      where: eq(automationMetrics.userId, session.user.id),
    });
    return NextResponse.json(allMetrics);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
