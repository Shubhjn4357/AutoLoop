import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialAutomations, connectedAccounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      triggerType,
      keywords,
      actionType,
      responseTemplate,
      connectedAccountId,
    } = body;

    if (!name || !triggerType || !actionType || !responseTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isWhatsAppTrigger =
      triggerType === "whatsapp_command" || triggerType === "whatsapp_keyword";

    let accountId = null;

    if (!isWhatsAppTrigger) {
      if (!connectedAccountId) {
        return NextResponse.json({ error: "Connected account is required" }, { status: 400 });
      }

      const account = await db.query.connectedAccounts.findFirst({
        where: and(
          eq(connectedAccounts.id, connectedAccountId),
          eq(connectedAccounts.userId, session.user.id)
        )
      });

      if (!account) {
        return NextResponse.json({ error: "Connected social account not found" }, { status: 400 });
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
