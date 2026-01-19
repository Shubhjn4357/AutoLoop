import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { automationWorkflows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    const workflows = await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.userId, userId))
      .orderBy(automationWorkflows.createdAt);

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await request.json();
    const {
      name,
      targetBusinessType,
      keywords,
      nodes,
      edges,
      isActive,
    } = body;

    const [workflow] = await db
      .insert(automationWorkflows)
      .values({
        userId,
        name,
        targetBusinessType: targetBusinessType || "",
        keywords: keywords || [],
        nodes: nodes || [],
        edges: edges || [],
        isActive: isActive || false,
      })
      .returning();

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await request.json();
    const { id, name, nodes, edges, isActive } = body;

    const [workflow] = await db
      .update(automationWorkflows)
      .set({
        name,
        nodes,
        edges,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(automationWorkflows.id, id),
          eq(automationWorkflows.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID required" },
        { status: 400 }
      );
    }

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
