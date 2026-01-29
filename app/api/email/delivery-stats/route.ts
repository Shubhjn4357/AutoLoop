import { auth } from "@/auth";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");
        // optional workflowId filter not currently used

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const whereConditions = [
            eq(emailLogs.userId, session.user.id),
            gte(emailLogs.createdAt, sinceDate),
        ];

        // Get delivery statistics
        const stats = await db
            .select({
                total: count(),
                sent: count(sql`CASE WHEN status = 'sent' THEN 1 END`),
                opened: count(sql`CASE WHEN status = 'opened' THEN 1 END`),
                clicked: count(sql`CASE WHEN status = 'clicked' THEN 1 END`),
                bounced: count(sql`CASE WHEN status = 'bounced' THEN 1 END`),
                failed: count(sql`CASE WHEN status IN ('failed', 'error') THEN 1 END`),
            })
            .from(emailLogs)
            .where(and(...whereConditions));

        // Get recent deliveries for detailed view
        const recentDeliveries = await db
            .select({
                id: emailLogs.id,
                businessId: emailLogs.businessId,
                subject: emailLogs.subject,
                status: emailLogs.status,
                sentAt: emailLogs.sentAt,
                openedAt: emailLogs.openedAt,
                clickedAt: emailLogs.clickedAt,
                errorMessage: emailLogs.errorMessage,
                createdAt: emailLogs.createdAt,
            })
            .from(emailLogs)
            .where(and(...whereConditions))
            .orderBy((t) => t.createdAt)
            .limit(100);

        // Calculate metrics
        const total = stats[0]?.total || 0;
        const sent = stats[0]?.sent || 0;
        const openCount = stats[0]?.opened || 0;
        const clickCount = stats[0]?.clicked || 0;

        const openRate = sent > 0 ? Math.round((openCount / sent) * 100) : 0;
        const clickRate = openCount > 0 ? Math.round((clickCount / openCount) * 100) : 0;

        return NextResponse.json({
            stats: {
                total,
                sent,
                opened: openCount,
                clicked: clickCount,
                bounced: stats[0]?.bounced || 0,
                failed: stats[0]?.failed || 0,
                openRate,
                clickRate,
                deliveryRate: sent > 0 ? Math.round(((sent - (stats[0]?.failed || 0)) / sent) * 100) : 0,
            },
            recentDeliveries,
            period: {
                days,
                since: sinceDate.toISOString(),
                until: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching delivery stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
