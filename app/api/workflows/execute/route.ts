import { auth } from "@/auth";
import { executeWorkflowLoop } from "@/lib/workflow-executor";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { workflowId } = body;

    if (!workflowId) {
      return new NextResponse("Workflow ID is required", { status: 400 });
    }

    const result = await executeWorkflowLoop(workflowId, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[WORKFLOW_EXECUTE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
