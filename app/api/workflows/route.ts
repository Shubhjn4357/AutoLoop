import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { automationWorkflows, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const workflows = await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.userId, queryUserId))
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

    // Fail-safe: Ensure admin user exists if this is the admin
    let finalUserId = userId;

    if (userId === "admin-user") {
      // 1. Try to find by ID first
      const existingUserById = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!existingUserById) {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          // 2. Try to find by Email
          const existingUserByEmail = await db.query.users.findFirst({
            where: eq(users.email, adminEmail)
          });

          if (existingUserByEmail) {
            // Use the existing user's ID
            finalUserId = existingUserByEmail.id;
          } else {
            // Create new admin user if absolutely disconnected
            await db.insert(users).values({
              id: userId,
              name: "Admin",
              email: adminEmail,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }

    const [workflow] = await db
      .insert(automationWorkflows)
      .values({
        userId: finalUserId,
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
