import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { contacts, contactTags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { IGUserProfile } from "@/lib/instagram/graph";
import { auth } from "@/lib/auth/config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { users } = await req.json();

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: "No users to import" }, { status: 400 });
  }

  const imported = [];
  const errors = [];

  for (const user of users) {
    try {
      // Check if contact already exists
      const existing = await db.query.contacts.findFirst({
        where: eq(contacts.senderId, user.id),
      });

      if (existing) {
        // Update existing contact
        const [updated] = await db
          .update(contacts)
          .set({
            name: user.name || existing.name,
            username: user.username || existing.username,
            profilePic: user.profile_picture_url || existing.profilePic,
            isFollower: true,
          })
          .where(eq(contacts.id, existing.id))
          .returning();
        imported.push(updated);
      } else {
        // Create new contact
        const [created] = await db
          .insert(contacts)
          .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            igUserId: "",
            senderId: user.id,
            name: user.name || user.username,
            username: user.username,
            profilePic: user.profile_picture_url,
            isFollower: true,
            status: "active",
          })
          .returning();
        imported.push(created);

        // Add "imported" tag
        await db.insert(contactTags).values({
          id: crypto.randomUUID(),
          contactId: created.id,
          tag: "imported",
        });
      }
    } catch (err) {
      console.error("Failed to import user:", user.username, err);
      errors.push(user.username);
    }
  }

  return NextResponse.json({ imported, errors, count: imported.length });
}
