import { NextRequest, NextResponse } from "next/server";

const DEFAULT_SERVER_BASE_URL = "http://localhost:7860";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.AUTOMATION_CRON_SECRET;
  const providedSecret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverApiKey = process.env.SERVER_API_KEY;
  if (!serverApiKey) {
    return NextResponse.json(
      { error: "SERVER_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const serverBaseUrl = process.env.SERVER_BASE_URL || DEFAULT_SERVER_BASE_URL;
  const response = await fetch(new URL("/api/automation/followups", serverBaseUrl), {
    method: "POST",
    headers: {
      "x-server-api-key": serverApiKey,
      "content-type": "application/json",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  return NextResponse.json(payload, { status: response.status });
}
