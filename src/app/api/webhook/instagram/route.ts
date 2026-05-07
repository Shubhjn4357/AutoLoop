import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/queue/engine";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import crypto from "crypto";

function signaturesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  // Rate limit by IP
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new NextResponse("Rate limited", { status: 429 });
  }

  try {
    const textBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify signature
    if (process.env.META_APP_SECRET && !signature) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (process.env.META_APP_SECRET && signature) {
      const hmac = crypto.createHmac("sha256", process.env.META_APP_SECRET);
      const digest = "sha256=" + hmac.update(textBody).digest("hex");
      if (!signaturesMatch(digest, signature)) {
        console.error("[Webhook] Signature mismatch");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const body = JSON.parse(textBody);

    // Only handle Instagram webhooks
    if (body.object !== "instagram") {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Queue events for async processing - NEVER process synchronously
    // This ensures fast response to Meta and reliable processing
    const result = await processWebhookEvent(body);

    if (!result.success) {
      console.error("[Webhook] Failed to queue events");
      return new NextResponse("Error", { status: 500 });
    }

    console.log(`[Webhook] Queued ${result.queued} events for processing`);

    // Return immediately - processing happens asynchronously
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return new NextResponse("Error parsing webhook", { status: 500 });
  }
}
