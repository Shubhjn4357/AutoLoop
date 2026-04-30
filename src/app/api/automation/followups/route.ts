import { NextResponse } from "next/server";

import { processDueFollowUps } from "@/lib/automation/engine";

export async function POST(request: Request) {
  const expectedSecret = process.env.AUTOMATION_CRON_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "AUTOMATION_CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueFollowUps();
  return NextResponse.json(result);
}

