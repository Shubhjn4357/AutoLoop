import crypto from "crypto";

import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { connectedAccounts, socialAutomations } from "@/db/schema";
import { buildSocialEventKey, claimSocialEvent } from "@/lib/social/event-dedupe";

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "autoloop_webhook_token_2026";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      if (entry.changes) {
        for (const change of entry.changes) {
          await handleWebhookChange(change, entry.id);
        }
      }

      if (entry.messaging) {
        for (const message of entry.messaging) {
          await handleMessagingEvent(message, entry.id);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Meta webhook:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

async function handleWebhookChange(change: Record<string, unknown>, providerAccountId: string) {
  const field = String(change.field || "");
  const value = (change.value || {}) as Record<string, unknown>;

  if (field === "comments" || field === "feed") {
    await handleCommentEvent(value, providerAccountId);
    return;
  }

  if (field === "mentions") {
    await handleMentionEvent(value, providerAccountId);
  }
}

async function handleCommentEvent(value: Record<string, unknown>, providerAccountId: string) {
  const account = await findAccount(providerAccountId);

  if (!account) {
    return;
  }

  const commentId = String(value.comment_id || value.id || "");
  const message = String(value.message || "");

  if (!commentId || !message) {
    return;
  }

  const eventKey = buildSocialEventKey(account.provider, account.id, "comment", commentId);
  const claimed = await claimSocialEvent(eventKey);

  if (!claimed) {
    return;
  }

  const author = (value.from || {}) as { id?: string; name?: string };
  const automations = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.connectedAccountId, account.id),
      eq(socialAutomations.isActive, true),
      inArray(socialAutomations.triggerType, ["comment_keyword", "any_comment"])
    ),
  });

  for (const automation of automations) {
    const matchedKeyword = automation.keywords?.find((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!matchedKeyword && automation.triggerType !== "any_comment") {
      continue;
    }

    const replyText = (automation.responseTemplate || "Thanks for your comment!")
      .replace(/\{keyword\}/g, matchedKeyword || "")
      .replace(/\{author\}/g, author.name || "there")
      .replace(/\{comment\}/g, message);

    if (automation.actionType === "reply_comment") {
      await replyToComment(commentId, replyText, account.accessToken, account.provider);
    } else if (automation.actionType === "send_dm" && author.id) {
      await sendDirectMessage(author.id, replyText, account.accessToken, account.provider);
    }
  }
}

async function handleMentionEvent(value: Record<string, unknown>, providerAccountId: string) {
  const account = await findAccount(providerAccountId);

  if (!account) {
    return;
  }

  const mentionId = String(value.media_id || value.id || "");

  if (!mentionId) {
    return;
  }

  const eventKey = buildSocialEventKey(account.provider, account.id, "mention", mentionId);
  const claimed = await claimSocialEvent(eventKey);

  if (!claimed) {
    return;
  }

  const automations = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.connectedAccountId, account.id),
      eq(socialAutomations.isActive, true),
      eq(socialAutomations.triggerType, "story_mention")
    ),
  });

  for (const automation of automations) {
    if (automation.actionType !== "send_dm") {
      continue;
    }

    const mentionerId = String(value.from || value.mentioned_by || "");

    if (!mentionerId) {
      continue;
    }

    await sendDirectMessage(
      mentionerId,
      automation.responseTemplate || "Thanks for the mention!",
      account.accessToken,
      account.provider
    );
  }
}

async function handleMessagingEvent(message: Record<string, unknown>, providerAccountId: string) {
  const account = await findAccount(providerAccountId);

  if (!account) {
    return;
  }

  const senderId = String((message.sender as { id?: string } | undefined)?.id || "");
  const messageText = String((message.message as { text?: string } | undefined)?.text || "");
  const messageId = String((message.message as { mid?: string } | undefined)?.mid || "");

  if (!senderId || !messageText || !messageId) {
    return;
  }

  const eventKey = buildSocialEventKey(account.provider, account.id, "dm", messageId);
  const claimed = await claimSocialEvent(eventKey);

  if (!claimed) {
    return;
  }

  const automations = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.connectedAccountId, account.id),
      eq(socialAutomations.isActive, true),
      eq(socialAutomations.triggerType, "dm_keyword")
    ),
  });

  for (const automation of automations) {
    const matched = automation.keywords?.some((keyword) =>
      messageText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!matched) {
      continue;
    }

    const replyText = (automation.responseTemplate || "Thanks for your message!")
      .replace(/\{author\}/g, senderId)
      .replace(/\{comment\}/g, messageText);

    await sendDirectMessage(senderId, replyText, account.accessToken, account.provider);
  }
}

async function findAccount(providerAccountId: string) {
  return db.query.connectedAccounts.findFirst({
    where: eq(connectedAccounts.providerAccountId, providerAccountId),
  });
}

async function replyToComment(
  commentId: string,
  replyText: string,
  accessToken: string,
  provider: string
) {
  const url =
    provider === "instagram"
      ? `https://graph.facebook.com/v21.0/${commentId}/replies`
      : `https://graph.facebook.com/v21.0/${commentId}/comments`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: replyText,
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Failed to post comment reply");
  }
}

async function sendDirectMessage(
  recipientId: string,
  replyText: string,
  accessToken: string,
  provider: string
) {
  if (provider === "linkedin") {
    const response = await fetch("https://api.linkedin.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        recipients: [`urn:li:person:${recipientId}`],
        subject: "Message from AutoLoop",
        body: replyText,
      }),
    });

    if (!response.ok) {
      const data = await response.text();
      throw new Error(`LinkedIn DM failed: ${data}`);
    }

    return;
  }

  const response = await fetch("https://graph.facebook.com/v21.0/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: replyText },
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Failed to send direct message");
  }
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appSecret || !signature) {
    return true;
  }

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  return signature === expectedSignature;
}
