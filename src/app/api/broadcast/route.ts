import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { contacts, socialAccounts, scheduledMessages, contactTags } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createNotificationLog } from "@/lib/notifications/logs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messageText, tag, senderIds } = body as {
    messageText?: string;
    tag?: string;
    senderIds?: string[];
  };

  if (!messageText?.trim()) {
    return NextResponse.json({ error: "messageText is required" }, { status: 400 });
  }

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  if (!account?.externalId || !account?.accessToken) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  let targetContacts: typeof contacts.$inferSelect[] = [];

  if (senderIds && senderIds.length > 0) {
    targetContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.userId, session.user.id),
        eq(contacts.externalId, account.externalId),
        inArray(contacts.senderId, senderIds)
      ),
    });
  } else if (tag) {
    const tagged = await db.query.contactTags.findMany({
      where: eq(contactTags.tag, tag),
    });
    const contactIds = tagged.map((t) => t.contactId);
    if (contactIds.length > 0) {
      targetContacts = await db.query.contacts.findMany({
        where: and(
          eq(contacts.userId, session.user.id),
          eq(contacts.externalId, account.externalId),
          inArray(contacts.id, contactIds)
        ),
      });
    }
  } else {
    return NextResponse.json({ error: "Provide tag or senderIds" }, { status: 400 });
  }

  // Enqueue broadcast messages with staggered delays (respect rate limits)
  const now = Date.now();
  const staggerMs = 2000; // 2 seconds between each to avoid Meta rate limits

  for (let i = 0; i < targetContacts.length; i++) {
    const contact = targetContacts[i];
    await db.insert(scheduledMessages).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      externalId: account.externalId,
      recipientId: contact.senderId,
      messageText: messageText.trim(),
      status: "pending",
      attempts: 0,
      dueAt: new Date(now + i * staggerMs),
    });
  }

  await createNotificationLog({
    userId: session.user.id,
    type: "broadcast.scheduled",
    title: "Broadcast scheduled",
    message: `${targetContacts.length} messages queued for broadcast.`,
    status: "success",
    metadata: { count: targetContacts.length, tag, senderIds },
  });

  return NextResponse.json({
    success: true,
    queued: targetContacts.length,
  });
}
