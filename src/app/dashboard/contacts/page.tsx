export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { contacts, contactTags } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { ContactsClient } from "./contacts-bridge";

export default async function ContactsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, session.user.id),
    orderBy: [desc(contacts.lastSeenAt)],
  });

  const contactIds = userContacts.map((c) => c.id);
  const allTags = contactIds.length > 0
    ? await db.query.contactTags.findMany({
      where: inArray(contactTags.contactId, contactIds),
    })
    : [];

  const tagsByContact = new Map<string, string[]>();
  for (const tag of allTags) {
    const list = tagsByContact.get(tag.contactId) ?? [];
    list.push(tag.tag);
    tagsByContact.set(tag.contactId, list);
  }

  const enrichedContacts = userContacts.map((c) => ({
    ...c,
    tags: tagsByContact.get(c.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">
          Manage your audience, tags, and conversation status.
        </p>
      </div>
      <ContactsClient contacts={enrichedContacts} />
    </div>
  );
}
