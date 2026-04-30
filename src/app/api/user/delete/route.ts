import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  users,
  accounts,
  sessions,
  instagramAccounts,
  automations,
  messages,
  notificationLogs,
  scheduledMessages,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Meta requires a public endpoint that accepts a user's deletion request.
 * This endpoint handles the signed_request param from Meta's callback.
 * For a full implementation, parse the signed_request JWT.
 * For now, we accept the user_id as a query param for direct API usage too.
 */
export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const signedRequest = body.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    // Decode the signed_request (base64url encoded)
    const [, payload] = signedRequest.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    const facebookUserId = decoded.user_id as string;

    if (!facebookUserId) {
      return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
    }

    // Find associated account by provider account id
    const linkedAccount = await db.query.accounts.findFirst({
      where: eq(accounts.providerAccountId, facebookUserId),
    });

    if (linkedAccount) {
      const userId = linkedAccount.userId;

      // Delete all user data in order (foreign keys)
      await db.delete(instagramAccounts).where(eq(instagramAccounts.userId, userId));
      await db.delete(automations).where(eq(automations.userId, userId));
      await db.delete(messages).where(eq(messages.userId, userId));
      await db.delete(notificationLogs).where(eq(notificationLogs.userId, userId));
      await db.delete(scheduledMessages).where(eq(scheduledMessages.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(users).where(eq(users.id, userId));

      // Also clean up messages linked to deleted IG accounts  
      // (cascade already handled by deleting ig accounts above)
    }

    // Meta requires a specific JSON response with a confirmation_code
    const confirmationCode = `autoloop_del_${facebookUserId}_${Date.now()}`;
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://shubhjn-autoloop.hf.space"}/user/delete?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
