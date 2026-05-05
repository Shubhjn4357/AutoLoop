import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { eq, and, desc as drizzleDesc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rules = await db.query.automations.findMany({
      where: eq(automations.userId, session.user.id),
      orderBy: [drizzleDesc(automations.createdAt)],
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("[API/Automation] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (id) {
      // Update existing
      const [updated] = await db
        .update(automations)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(automations.id, id), eq(automations.userId, session.user.id)))
        .returning();
      return NextResponse.json(updated);
    } else {
      // Create new
      const [created] = await db
        .insert(automations)
        .values({ 
          ...data, 
          userId: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("[API/Automation] POST Error:", error);
    return NextResponse.json({ error: "Failed to save automation" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await db
      .delete(automations)
      .where(and(eq(automations.id, id), eq(automations.userId, session.user.id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Automation] DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete automation" }, { status: 500 });
  }
}
