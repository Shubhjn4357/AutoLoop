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

    // For whatsapp_command, we don't need a connected account as it uses the user's global WhatsApp config
    let accountId = null;

    if (triggerType !== 'whatsapp_command') {
      const account = await db.query.connectedAccounts.findFirst({
        where: eq(connectedAccounts.userId, session.user.id)
      });

      if (!account) {
        return NextResponse.json({ error: "No connected social account found" }, { status: 400 });
      }
      accountId = account.id;
    }

    await db.insert(socialAutomations).values({
      userId: session.user.id,
      connectedAccountId: accountId, // Linking to first account found for now or null for global commands
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
