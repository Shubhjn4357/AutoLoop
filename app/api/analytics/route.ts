import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { emailLogs, businesses } from "@/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get all businesses for this user
    const userBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.userId, userId));

    const businessIds = userBusinesses.map(b => b.id);

    if (businessIds.length === 0) {
      return NextResponse.json({
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
      });
    }

    // Aggregate email statistics
    const stats = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        delivered: sql<number>`cast(sum(case when ${emailLogs.status} in ('sent', 'delivered', 'opened', 'clicked') then 1 else 0 end) as int)`,
        opened: sql<number>`cast(sum(case when ${emailLogs.status} in ('opened', 'clicked') then 1 else 0 end) as int)`,
        clicked: sql<number>`cast(sum(case when ${emailLogs.status} = 'clicked' then 1 else 0 end) as int)`,
        replied: sql<number>`cast(sum(case when ${emailLogs.status} = 'replied' then 1 else 0 end) as int)`,
        bounced: sql<number>`cast(sum(case when ${emailLogs.status} = 'bounced' then 1 else 0 end) as int)`,
      })
      .from(emailLogs)
      .where(inArray(emailLogs.businessId, businessIds));

    const totalSent = Number(stats[0]?.total || 0);
    const delivered = Number(stats[0]?.delivered || 0);
    const opened = Number(stats[0]?.opened || 0);
    const clicked = Number(stats[0]?.clicked || 0);
    const replied = Number(stats[0]?.replied || 0);
    const bounced = Number(stats[0]?.bounced || 0);

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const replyRate = delivered > 0 ? (replied / delivered) * 100 : 0;

    return NextResponse.json({
      totalSent,
      delivered,
      opened,
      clicked,
      replied,
      bounced,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      replyRate: Math.round(replyRate * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
