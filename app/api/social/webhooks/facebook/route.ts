/**
 * Facebook Webhook Handler
 * Handles real-time webhook events from Facebook/Instagram
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialAutomations, connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
/**
 * GET handler for webhook verification
 * Facebook requires this for webhook setup
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Verify token (should match the one set in Facebook App dashboard)
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "autoloop_webhook_token_2024";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified");
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.error("❌ Webhook verification failed");
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
}

/**
 * POST handler for webhook events
 * Receives real-time updates from Facebook/Instagram
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log("📨 Received webhook event:", JSON.stringify(body, null, 2));

        // Verify the webhook signature (recommended for production)
        // const signature = request.headers.get("x-hub-signature-256");
        // if (!verifySignature(body, signature)) {
        //   return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        // }

        // Process each entry in the webhook
        if (body.object === "page" || body.object === "instagram") {
            for (const entry of body.entry || []) {
                // Handle different webhook fields
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
        }

        // Facebook expects a 200 OK response
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        // Still return 200 to prevent Facebook from retrying
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

/**
 * Handle webhook change events (comments, posts, etc.)
 */
async function handleWebhookChange(change: Record<string, unknown>, pageId: string) {
    const { field, value } = change;

    console.log(`📝 Webhook change: ${field}`, value);

    switch (field) {
        case "comments":
            await handleCommentEvent(value as Record<string, unknown>, pageId);
            break;
        case "feed":
            await handleFeedEvent(value as Record<string, unknown>, pageId);
            break;
        case "mentions":
            await handleMentionEvent(value as Record<string, unknown>, pageId);
            break;
        default:
            console.log(`ℹ️ Unhandled webhook field: ${field}`);
    }
}

/**
 * Handle comment events
 */
async function handleCommentEvent(value: Record<string, unknown>, pageId: string) {
    const commentData = value as {
        id?: string;
        post_id?: string;
        message?: string;
        from?: { id: string; name: string };
        created_time?: string;
        parent_id?: string; // For comment replies
    };

    if (!commentData.message || !commentData.from) {
        console.log("⚠️ Incomplete comment data");
        return;
    }

    console.log(`💬 New comment: "${commentData.message.substring(0, 50)}..." by ${commentData.from.name}`);

    // Find matching automations
    const account = await db.query.connectedAccounts.findFirst({
        where: eq(connectedAccounts.providerAccountId, pageId),
    });

    if (!account) {
        console.log(`⚠️ No account found for page ${pageId}`);
        return;
    }

    const automations = await db.query.socialAutomations.findMany({
        where: eq(socialAutomations.connectedAccountId, account.id),
    });

    // Check each automation for keyword matches
    for (const automation of automations) {
        if (!automation.isActive) continue;

        if (automation.triggerType !== "comment_keyword" && automation.triggerType !== "any_comment") {
            continue;
        }

        // Check keywords
        const keywords = automation.keywords || [];
        const matchedKeyword = keywords.find(keyword =>
            commentData.message!.toLowerCase().includes(keyword.toLowerCase())
        );

        if (matchedKeyword || automation.triggerType === "any_comment") {
            console.log(`✅ Matched automation: "${automation.name}"`);

            // Execute auto-reply
            await executeAutoReplyToComment(
                commentData.id!,
                automation.responseTemplate || "Thank you for your comment!",
                account.accessToken,
                account.provider
            );
        }
    }
}

/**
 * Handle feed events (new posts)
 */
async function handleFeedEvent(value: Record<string, unknown>, pageId: string) {
    console.log(`📰 Feed event for page ${pageId}`);
    // Could trigger automations based on new posts
}

/**
 * Handle mention events
 */
async function handleMentionEvent(value: Record<string, unknown>, pageId: string) {
    console.log(`@️ Mention event for page ${pageId}`);
    // Could trigger automations based on mentions
}

/**
 * Handle messaging events (DMs)
 */
async function handleMessagingEvent(message: Record<string, unknown>, pageId: string) {
    console.log(`📬 Messaging event for page ${pageId}`, message);
    // Could handle DM-based automations
}

/**
 * Execute auto-reply to a comment
 */
async function executeAutoReplyToComment(
    commentId: string,
    replyText: string,
    accessToken: string,
    provider: string
) {
    try {
        let url = "";

        if (provider === "facebook") {
            url = `https://graph.facebook.com/v21.0/${commentId}/comments`;
        } else if (provider === "instagram") {
            url = `https://graph.facebook.com/v21.0/${commentId}/replies`;
        } else {
            console.log(`⚠️ Platform ${provider} not supported`);
            return;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: replyText,
                access_token: accessToken,
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ Error posting reply:", data.error);
        } else {
            console.log(`✅ Auto-reply posted successfully`);
        }
    } catch (error) {
        console.error("❌ Error in executeAutoReplyToComment:", error);
    }
}

/**
 * Verify webhook signature (optional but recommended)
 * Currently unused but kept for future implementation
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
function verifySignature(body: unknown, signature: string | null): boolean {
    if (!signature) return false;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";

    const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", APP_SECRET)
        .update(JSON.stringify(body))
        .digest("hex");

    return signature === expectedSignature;
}
/* eslint-enable @typescript-eslint/no-unused-vars */
