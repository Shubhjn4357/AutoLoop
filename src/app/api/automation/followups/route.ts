import { NextResponse } from "next/server";
import { processScheduledMessages, processQueueBatch } from "@/lib/queue/engine";

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

  try {
    // Process both scheduled messages and queue events
    const [scheduledResult, queueResult] = await Promise.all([
      processScheduledMessages(),
      processQueueBatch(50),
    ]);

    return NextResponse.json({
      scheduled: scheduledResult,
      queue: queueResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

