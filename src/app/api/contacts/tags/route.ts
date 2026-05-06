import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { contactTags, contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, tag } = body;

  if (!contactId || !tag?.trim()) {
    return NextResponse.json({ error: "contactId and tag required" }, { status: 400 });
  }

  // Verify ownership
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.userId, session.user.id)),
  });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Prevent duplicates
  const existing = await db.query.contactTags.findFirst({
    where: and(eq(contactTags.contactId, contactId), eq(contactTags.tag, tag.trim())),
  });
  if (existing) {
    return NextResponse.json({ success: true });
  }

  await db.insert(contactTags).values({
    id: crypto.randomUUID(),
    contactId,
    tag: tag.trim(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, tag } = body;

  if (!contactId || !tag) {
    return NextResponse.json({ error: "contactId and tag required" }, { status: 400 });
  }

  await db
    .delete(contactTags)
    .where(and(eq(contactTags.contactId, contactId), eq(contactTags.tag, tag)));

  return NextResponse.json({ success: true });
}
