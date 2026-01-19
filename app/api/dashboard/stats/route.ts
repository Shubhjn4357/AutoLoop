import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses, emailTemplates, automationWorkflows, emailLogs } from "@/db/schema";
import { SessionUser } from "@/types";
import { eq, and, gte, sql, count } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    // Get total counts
    const [businessCount, templateCount, workflowCount] = await Promise.all([
      db.select({ count: count() }).from(businesses).where(eq(businesses.userId, userId)),
      db.select({ count: count() }).from(emailTemplates).where(eq(emailTemplates.userId, userId)),
      db.select({ count: count() }).from(automationWorkflows).where(eq(automationWorkflows.userId, userId)),
    ]);

    // Get email metrics from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const emailStats = await db
      .select({
        total: count(),
        sent: sql<number>`count(case when status = 'sent' OR status = 'opened' OR status = 'clicked' then 1 end)`,
        opened: sql<number>`count(case when status = 'opened' OR status = 'clicked' then 1 end)`,
        clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.userId, userId),
          gte(emailLogs.createdAt, thirtyDaysAgo)
        )
      );

    const stats = emailStats[0];
    const totalSent = Number(stats.sent) || 0;
    const opened = Number(stats.opened) || 0;
    const clicked = Number(stats.clicked) || 0;

    // Get time-series data for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const timeSeriesData = await db
      .select({
        date: sql<string>`TO_CHAR(created_at, 'Dy')`,
        sent: count(),
        opened: sql<number>`count(case when status = 'opened' OR status = 'clicked' then 1 end)`,
      })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.userId, userId),
          gte(emailLogs.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(created_at), TO_CHAR(created_at, 'Dy')`)
      .orderBy(sql`DATE(created_at)`);

    // Get businesses with email status
    const businessesWithEmail = await db
      .select({ count: count() })
      .from(businesses)
      .where(and(eq(businesses.userId, userId), eq(businesses.emailSent, true)));

    return NextResponse.json({
      stats: {
        totalBusinesses: businessCount[0]?.count || 0,
        totalTemplates: templateCount[0]?.count || 0,
        totalWorkflows: workflowCount[0]?.count || 0,
        emailsSent: totalSent,
        emailsOpened: opened,
        emailsClicked: clicked,
        openRate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((clicked / totalSent) * 100) : 0,
      },
      chartData: timeSeriesData.map((row) => ({
        name: row.date,
        sent: Number(row.sent),
        opened: Number(row.opened),
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
