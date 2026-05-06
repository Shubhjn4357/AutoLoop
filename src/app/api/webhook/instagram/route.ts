import { after, NextResponse } from "next/server";
import { processInstagramMessage, processInstagramComment } from "@/lib/automation/engine";
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
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new NextResponse("Rate limited", { status: 429 });
  }

  try {
    const textBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (process.env.META_APP_SECRET && !signature) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (process.env.META_APP_SECRET && signature) {
      const hmac = crypto.createHmac("sha256", process.env.META_APP_SECRET);
      const digest = "sha256=" + hmac.update(textBody).digest("hex");
      if (!signaturesMatch(digest, signature)) {
        console.error("Webhook signature mismatch.");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const body = JSON.parse(textBody);

    if (body.object === "instagram") {
      const backgroundTasks: Promise<void>[] = [];

      for (const entry of body.entry) {
        // 1. Handle DMs
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            console.log("Received message:", messaging);
            if (messaging.message?.is_echo) continue;

            if (messagingHasTextMessage(messaging)) {
              const storyId = messaging.message.reply_to?.story?.id;
              backgroundTasks.push(
                processInstagramMessage({
                  igUserId: entry.id,
                  senderId: messaging.sender.id,
                  text: messaging.message.text,
                  storyId,
                }).catch((e) => console.error("DM Process Error:", e))
              );
            }
          }
        }

        // 2. Handle Comments
        if (entry.changes) {
          for (const change of entry.changes) {
            console.log("Received change:", change);
            if (change.field === "comments") {
              const val = change.value;
              // Ignore replies to comments to avoid infinite loops
              if (val.parent_id) continue;

              backgroundTasks.push(
                processInstagramComment({
                  igUserId: entry.id,
                  senderId: val.from.id,
                  text: val.text,
                  mediaId: val.media.id,
                  commentId: val.id,
                }).catch((e) => console.error("Comment Process Error:", e))
              );
            }
          }
        }
      }

      after(Promise.all(backgroundTasks).catch(console.error));
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Error parsing webhook", { status: 500 });
  }
}

interface InstagramMessagingEvent {
  sender: { id: string };
  message?: {
    text?: string;
    is_echo?: boolean;
    reply_to?: {
      story?: {
        id: string;
        url: string;
      };
    };
  };
}

function messagingHasTextMessage(
  messaging: InstagramMessagingEvent
): messaging is InstagramMessagingEvent & { message: { text: string } } {
  return typeof messaging.message?.text === "string" && messaging.message.text.length > 0;
}
