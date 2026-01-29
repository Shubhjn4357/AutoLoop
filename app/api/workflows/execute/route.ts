import { auth } from "@/auth";
import { executeWorkflowLoopWithLogging } from "@/lib/workflow-executor";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workflowExecutionLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
  try {
    const session = await auth();
      if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const body = await req.json();
      const { workflowId, businessId } = body;

      if (!workflowId) {
        return new NextResponse("Workflow ID is required", { status: 400 });
      }

      const userId = await getEffectiveUserId(session.user.id);
      const result = await executeWorkflowLoopWithLogging(workflowId, userId, businessId);

      return NextResponse.json(result);
    } catch (error) {
      console.error("[WORKFLOW_EXECUTE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
};

// NEW: Get execution status
export const GET = async (req: Request) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const executionId = searchParams.get("executionId");

    if (!executionId) {
      return new NextResponse("Execution ID is required", { status: 400 });
    }

    const execution = await db.query.workflowExecutionLogs.findFirst({
      where: eq(workflowExecutionLogs.id, executionId),
    });

    if (!execution) {
      return new NextResponse("Execution not found", { status: 404 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error("[WORKFLOW_EXECUTE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch execution status" },
      { status: 500 }
    );
  }
};
