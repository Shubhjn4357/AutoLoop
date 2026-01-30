import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { automationWorkflows, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionUser } from "@/types";
import { Edge, Node } from "reactflow";

export async function GET(
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

    let queryUserId = userId;

    if (userId === "admin-user") {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const existingUserByEmail = await db.query.users.findFirst({
          where: eq(users.email, adminEmail)
        });
        if (existingUserByEmail) {
          queryUserId = existingUserByEmail.id;
        }
      }
    }

    const workflow = await db.query.automationWorkflows.findFirst({
      where: and(
        eq(automationWorkflows.id, id),
        eq(automationWorkflows.userId, queryUserId)
      )
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });

  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

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

    let queryUserId = userId;

    if (userId === "admin-user") {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const existingUserByEmail = await db.query.users.findFirst({
          where: eq(users.email, adminEmail)
        });
        if (existingUserByEmail) {
          queryUserId = existingUserByEmail.id;
        }
      }
    }

     
    const updates: Partial<{
      name: string;
      isActive: boolean;
      priority: string;
      nodes: Node[];
      edges: Edge[];
      targetBusinessType: string;
      updatedAt: Date
    }> = {
      updatedAt: new Date(),
    };

    if (body.name) updates.name = body.name;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (body.nodes) updates.nodes = body.nodes;
    if (body.edges) updates.edges = body.edges;
    if (body.targetBusinessType) updates.targetBusinessType = body.targetBusinessType;

    if (body.priority && ["low", "medium", "high"].includes(body.priority)) {
      updates.priority = body.priority;
    }

    if (Object.keys(updates).length > 1) { // updatedAt is always there
      await db
        .update(automationWorkflows)
        .set(updates as Record<string, unknown>)
        .where(
          and(
            eq(automationWorkflows.id, id),
            eq(automationWorkflows.userId, queryUserId)
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

    let queryUserId = userId;

    if (userId === "admin-user") {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const existingUserByEmail = await db.query.users.findFirst({
          where: eq(users.email, adminEmail)
        });
        if (existingUserByEmail) {
          queryUserId = existingUserByEmail.id;
        }
      }
    }

    await db
      .delete(automationWorkflows)
      .where(
        and(
          eq(automationWorkflows.id, id),
          eq(automationWorkflows.userId, queryUserId)
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
