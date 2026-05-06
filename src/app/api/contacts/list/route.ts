import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, session.user.id),
    orderBy: [desc(contacts.lastSeenAt)],
    limit,
  });

  return NextResponse.json({ contacts: userContacts });
}
