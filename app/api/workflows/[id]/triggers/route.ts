
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { workflowTriggers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEffectiveUserId } from "@/lib/auth-utils";

// GET triggers for workflow
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);
    const triggers = await db.query.workflowTriggers.findMany({
        where: and(
            eq(workflowTriggers.workflowId, params.id),
            eq(workflowTriggers.userId, userId)
        ),
    });

    return NextResponse.json({ triggers });
}

// POST create trigger
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);
    const body = await request.json();
    const { triggerType, config } = body;

    const [trigger] = await db
        .insert(workflowTriggers)
        .values({
            workflowId: params.id,
            userId,
            triggerType,
            config,
            nextRunAt: new Date(), // Run immediately first time
        })
        .returning();

    return NextResponse.json(trigger);
}
