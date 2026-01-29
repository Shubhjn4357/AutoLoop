import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { automationWorkflows, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SessionUser } from "@/types";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ApiErrors } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw ApiErrors.UNAUTHORIZED();
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

    // Fetch workflows
    const workflowsData = await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.userId, queryUserId))
      .orderBy(automationWorkflows.createdAt);

    // Manually fetch and aggregate stats (Drizzle aggregation/group by can be complex with relations, 
    // simpler to just fetch derived data or do a separate count query if volume is low.
    // For MVP, separate query per workflow or one big group by. 
    // Let's do a left join aggregation.)

    // Actually, let's fetch basic stats separately to avoid N+1 if list is huge, 
    // but for < 50 workflows, a loop is fine or a single complex query.
    // Let's stick to simple: Fetch all, then map.

    // We need: executionCount, lastRunAt
    // We can add these fields to the response object.

    const enrichedWorkflows = await Promise.all(workflowsData.map(async (wf) => {
      // Count executions
      const countResult = await db.execute(sql`
            SELECT count(*) as count, max(started_at) as last_run
            FROM workflow_execution_logs 
            WHERE workflow_id = ${wf.id}
        `);

      const row = countResult.rows[0] as { count: string, last_run: string | null };

      return {
        ...wf,
        executionCount: Number(row.count),
        lastRunAt: row.last_run ? new Date(row.last_run) : null
      };
    }));

    return apiSuccess({ workflows: enrichedWorkflows });
  } catch (error) {
    return apiError(error);
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
      description,
      targetBusinessType,
      keywords,
      nodes,
      edges,
      isActive,
      timezone,
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
        description: description || "",
        targetBusinessType: targetBusinessType || "",
        keywords: keywords || [],
        nodes: nodes || [],
        edges: edges || [],
        isActive: isActive || false,
        timezone: timezone || "UTC",
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
    const { id, name, description, nodes, edges, isActive, timezone } = body;

    const [workflow] = await db
      .update(automationWorkflows)
      .set({
        name,
        description,
        nodes,
        edges,
        isActive,
        timezone,
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
