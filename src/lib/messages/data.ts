import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contacts, messages, contactTags } from "@/lib/db/schema";

export interface Conversation {
  contact: typeof contacts.$inferSelect;
  tags: string[];
  lastMessage: {
    text: string;
    direction: string;
    timestamp: Date;
  } | null;
  unreadCount: number;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: [desc(contacts.lastSeenAt)],
  });

  if (userContacts.length === 0) return [];

  const contactIds = userContacts.map((c) => c.id);

  const [allTags, lastMessages] = await Promise.all([
    db.query.contactTags.findMany({
      where: inArray(contactTags.contactId, contactIds),
    }),
    db
      .select({
        senderId: messages.senderId,
        text: messages.text,
        direction: messages.direction,
        timestamp: messages.timestamp,
      })
      .from(messages)
      .where(
        inArray(
          messages.senderId,
          userContacts.map((c) => c.senderId)
        )
      )
      .orderBy(desc(messages.timestamp)),
  ]);

  const tagsByContact = new Map<string, string[]>();
  for (const tag of allTags) {
    const list = tagsByContact.get(tag.contactId) ?? [];
    list.push(tag.tag);
    tagsByContact.set(tag.contactId, list);
  }

  const lastMessageBySender = new Map<string, typeof lastMessages[0]>();
  for (const msg of lastMessages) {
    if (!lastMessageBySender.has(msg.senderId)) {
      lastMessageBySender.set(msg.senderId, msg);
    }
  }

  return userContacts.map((contact) => ({
    contact,
    tags: tagsByContact.get(contact.id) ?? [],
    lastMessage: lastMessageBySender.has(contact.senderId)
      ? {
          text: lastMessageBySender.get(contact.senderId)!.text,
          direction: lastMessageBySender.get(contact.senderId)!.direction,
          timestamp: lastMessageBySender.get(contact.senderId)!.timestamp,
        }
      : null,
    unreadCount: 0, // Placeholder until we add read receipts
  }));
}

export async function getThreadMessages(userId: string, senderId: string) {
  return db.query.messages.findMany({
    where: and(eq(messages.userId, userId), eq(messages.senderId, senderId)),
    orderBy: [desc(messages.timestamp)],
    limit: 100,
  });
}
