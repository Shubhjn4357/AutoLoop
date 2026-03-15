
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialAutomations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const automations = await db.query.socialAutomations.findMany({
            where: eq(socialAutomations.userId, session.user.id),
            orderBy: [desc(socialAutomations.createdAt)],
            with: {
                account: true,
            },
        });

        return NextResponse.json(
            automations.map((automation) => ({
                ...automation,
                platform: automation.account?.provider || (
                    automation.triggerType.startsWith("whatsapp_") ? "whatsapp" : "unassigned"
                ),
            }))
        );
    } catch (error) {
        console.error("Error fetching automations:", error);
        return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
    }
}
