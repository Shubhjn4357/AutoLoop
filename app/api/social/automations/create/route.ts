import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialAutomations, connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, triggerType, keywords, actionType, responseTemplate } = body;

    if (!name || !triggerType || !actionType || !responseTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // For MVP, we automatically link to the first connected account or all?
    // The schema allows `connectedAccountId` to be null (meaning global?) or specific.
    // The form currently doesn't ask for account. Let's find a default one for now to link it,
    // or just pick the first one. A real app would let you choose "Apply to which account?".
    const account = await db.query.connectedAccounts.findFirst({
      where: eq(connectedAccounts.userId, session.user.id)
    });

    if (!account) {
      return NextResponse.json({ error: "No connected social account found" }, { status: 400 });
    }

    await db.insert(socialAutomations).values({
      userId: session.user.id,
      connectedAccountId: account.id, // Linking to first account found for now
      name,
      triggerType,
      keywords, // Array of strings
      actionType,
      responseTemplate,
      isActive: true
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Automation Rule Creation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
