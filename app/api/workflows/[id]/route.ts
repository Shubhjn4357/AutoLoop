import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { automationWorkflows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as SessionUser).id;
    const body = await request.json();

    // Toggle isActive or update priority
    const updates: Partial<{ isActive: boolean; priority: string; updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }

    if (body.priority && ["low", "medium", "high"].includes(body.priority)) {
      updates.priority = body.priority;
    }

    if (Object.keys(updates).length > 1) { // updatedAt is always there
      await db
        .update(automationWorkflows)
        .set(updates)
        .where(
          and(
            eq(automationWorkflows.id, id),
            eq(automationWorkflows.userId, userId)
          )
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as SessionUser).id;

    await db
      .delete(automationWorkflows)
      .where(
        and(
          eq(automationWorkflows.id, id),
          eq(automationWorkflows.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
