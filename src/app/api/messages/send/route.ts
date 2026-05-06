import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendInstagramMessage } from "@/lib/instagram/client";
import { createNotificationLog } from "@/lib/notifications/logs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipientId, text } = body as { recipientId?: string; text?: string };

  if (!recipientId || !text?.trim()) {
    return NextResponse.json({ error: "recipientId and text are required" }, { status: 400 });
  }

  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  if (!account?.igUserId || !account?.accessToken) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  try {
    await sendInstagramMessage(account.igUserId, recipientId, text.trim(), account.accessToken);

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      igUserId: account.igUserId,
      senderId: recipientId,
      direction: "outbound",
      status: "sent",
      text: text.trim(),
      timestamp: new Date(),
    });

    await createNotificationLog({
      userId: session.user.id,
      type: "message.sent",
      title: "Manual message sent",
      message: `Sent to ${recipientId}`,
      status: "success",
      metadata: { recipientId, text: text.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/messages/send]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
