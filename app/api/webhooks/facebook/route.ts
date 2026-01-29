import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialAutomations, connectedAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
// Not implemented yet, but will be referenced
// import { replyToComment, sendPrivateMessage } from "@/lib/social/publisher"; 

// Verification Token for Facebook to verify our endpoint
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "autoloop_verify_token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === "page" || body.object === "instagram") {
      // Process each entry
      for (const entry of body.entry) {
        const entryId = entry.id; // Page ID or IG Business ID

        // Find connected account for this ID to get access token? 
        // We might need to look up automations FIRST by accountId.

        // Handle Messaging (DMs)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            // event.sender.id, event.message.text
            await handleMessagingEvent(entryId, event);
          }
        }

        // Handle Feed (Comments)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "feed" || change.field === "comments") {
              await handleFeedEvent(entryId, change.value);
            }
          }
        }
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    return new NextResponse("Not Found", { status: 404 });

  } catch (error: unknown) {
    console.error("Webhook Error:", error instanceof Error ? error.message : String(error));
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
async function handleMessagingEvent(accountId: string, event: unknown) {
  const evt = event as { sender?: { id?: string }; message?: { text?: string } };
  const messageText = evt.message?.text;

  if (!messageText) return;

  // Find automations for this account
  const account = await db.query.connectedAccounts.findFirst({
    where: eq(connectedAccounts.providerAccountId, accountId)
  });

  if (!account) return;

  const automations = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.connectedAccountId, account.id),
      eq(socialAutomations.isActive, true),
      eq(socialAutomations.triggerType, "dm_keyword")
    )
  });

  for (const auto of automations) {
    if (auto.keywords && auto.keywords.some(k => messageText.toLowerCase().includes(k.toLowerCase()))) {
      console.log(`Matched DM Rule: ${auto.name}`);
    }
  }
}

async function handleFeedEvent(accountId: string, change: unknown) {
  const ch = change as { item?: string; verb?: string; message?: string; comment_id?: string; post_id?: string };
  if (ch.item !== "comment" && ch.verb !== "add") return;

  const messageText = ch.message || "";

  const account = await db.query.connectedAccounts.findFirst({
    where: eq(connectedAccounts.providerAccountId, accountId)
  });

  if (!account) return;

  const automations = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.connectedAccountId, account.id),
      eq(socialAutomations.isActive, true)
    )
  });

  for (const auto of automations) {
    let isMatch = false;
    if (auto.triggerType === "any_comment") isMatch = true;
    if (auto.triggerType === "comment_keyword" && auto.keywords) {
      isMatch = auto.keywords.some(k => messageText.toLowerCase().includes(k.toLowerCase()));
    }

    if (isMatch) {
      console.log(`Matched Feed Rule: ${auto.name}`);
    }
  }
}
