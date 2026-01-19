import { db } from "@/db";
import { emailLogs, businesses } from "@/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";

export interface AnalyticsData {
  overview: {
    totalBusinesses: number;
    emailsSent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    replyRate: number;
  };
  timeSeriesData: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  }[];
  campaignPerformance: {
    campaignId: string;
    campaignName: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }[];
  topPerformingTemplates: {
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }[];
  businessCategoryBreakdown: {
    category: string;
    count: number;
    openRate: number;
  }[];
}

/**
 * Get comprehensive analytics for a user
 */
export async function getAdvancedAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsData> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate || new Date();

  // Overview metrics
  const totalBusinesses = await db
    .select({ count: count() })
    .from(businesses)
    .where(eq(businesses.userId, userId));

  const emailStats = await db
    .select({
      total: count(),
      opened: sql<number>`count(case when status = 'opened' then 1 end)`,
      clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      bounced: sql<number>`count(case when status = 'bounced' then 1 end)`,
    })
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.userId, userId),
        gte(emailLogs.sentAt, start),
        lte(emailLogs.sentAt, end)
      )
    );

  const stats = emailStats[0];
  const total = Number(stats.total) || 1;
  const opened = Number(stats.opened) || 0;
  const clicked = Number(stats.clicked) || 0;
  const bounced = Number(stats.bounced) || 0;

  // Time series data (last 30 days)
  const timeSeriesData = await db
    .select({
      date: sql<string>`DATE(sent_at)`,
      sent: count(),
      opened: sql<number>`count(case when status = 'opened' then 1 end)`,
      clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      bounced: sql<number>`count(case when status = 'bounced' then 1 end)`,
    })
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.userId, userId),
        gte(emailLogs.sentAt, start),
        lte(emailLogs.sentAt, end)
      )
    )
    .groupBy(sql`DATE(sent_at)`)
    .orderBy(sql`DATE(sent_at)`);

  // Campaign performance (by template instead of workflow since workflowId doesn't exist)
  const campaignPerformance = await db
    .select({
      templateId: emailLogs.templateId,
      sent: count(),
      opened: sql<number>`count(case when status = 'opened' then 1 end)`,
      clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
    })
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.userId, userId),
        gte(emailLogs.sentAt, start),
        lte(emailLogs.sentAt, end)
      )
    )
    .groupBy(emailLogs.templateId);

  // Business category breakdown
  const categoryBreakdown = await db
    .select({
      category: businesses.category,
      count: count(),
    })
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .groupBy(businesses.category);

  return {
    overview: {
      totalBusinesses: totalBusinesses[0]?.count || 0,
      emailsSent: total,
      openRate: (opened / total) * 100,
      clickRate: (clicked / total) * 100,
      bounceRate: (bounced / total) * 100,
      replyRate: 0, // To be implemented with reply tracking
    },
    timeSeriesData: timeSeriesData.map((row) => ({
      date: row.date,
      sent: Number(row.sent),
      opened: Number(row.opened),
      clicked: Number(row.clicked),
      bounced: Number(row.bounced),
    })),
    campaignPerformance: campaignPerformance.map((row) => {
      const sent = Number(row.sent);
      const opened = Number(row.opened);
      const clicked = Number(row.clicked);
      return {
        campaignId: row.templateId || "unknown",
        campaignName: "Template Campaign", // To be joined with templates
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      };
    }),
    topPerformingTemplates: [], // To be implemented
    businessCategoryBreakdown: categoryBreakdown.map((row) => ({
      category: row.category || "Unknown",
      count: Number(row.count),
      openRate: 0, // To be calculated with join
    })),
  };
}

/**
 * Get real-time campaign metrics by template
 */
export async function getCampaignMetrics(templateId: string) {
  const metrics = await db
    .select({
      total: count(),
      pending: sql<number>`count(case when status = 'pending' then 1 end)`,
      sent: sql<number>`count(case when status = 'sent' then 1 end)`,
      opened: sql<number>`count(case when status = 'opened' then 1 end)`,
      clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      bounced: sql<number>`count(case when status = 'bounced' then 1 end)`,
      failed: sql<number>`count(case when status = 'failed' then 1 end)`,
    })
    .from(emailLogs)
    .where(eq(emailLogs.templateId, templateId));

  const data = metrics[0];
  const total = Number(data.total) || 1;

  return {
    total,
    pending: Number(data.pending),
    sent: Number(data.sent),
    opened: Number(data.opened),
    clicked: Number(data.clicked),
    bounced: Number(data.bounced),
    failed: Number(data.failed),
    openRate: (Number(data.opened) / total) * 100,
    clickRate: (Number(data.clicked) / total) * 100,
    bounceRate: (Number(data.bounced) / total) * 100,
  };
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(userId: string) {
  const data = await db
    .select({
      sent: count(),
      opened: sql<number>`count(case when status = 'opened' then 1 end)`,
      clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      replied: sql<number>`count(case when status = 'replied' then 1 end)`,
    })
    .from(emailLogs)
    .where(eq(emailLogs.userId, userId));

  const stats = data[0];
  return {
    sent: Number(stats.sent),
    opened: Number(stats.opened),
    clicked: Number(stats.clicked),
    replied: Number(stats.replied),
  };
}

/**
 * Compare A/B test results
 */
export async function compareABTest(templateIdA: string, templateIdB: string) {
  const [resultsA, resultsB] = await Promise.all([
    db
      .select({
        sent: count(),
        opened: sql<number>`count(case when status = 'opened' then 1 end)`,
        clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      })
      .from(emailLogs)
      .where(eq(emailLogs.templateId, templateIdA)),
    db
      .select({
        sent: count(),
        opened: sql<number>`count(case when status = 'opened' then 1 end)`,
        clicked: sql<number>`count(case when status = 'clicked' then 1 end)`,
      })
      .from(emailLogs)
      .where(eq(emailLogs.templateId, templateIdB)),
  ]);

  const sentA = Number(resultsA[0].sent) || 1;
  const sentB = Number(resultsB[0].sent) || 1;

  return {
    templateA: {
      sent: sentA,
      opened: Number(resultsA[0].opened),
      clicked: Number(resultsA[0].clicked),
      openRate: (Number(resultsA[0].opened) / sentA) * 100,
      clickRate: (Number(resultsA[0].clicked) / sentA) * 100,
    },
    templateB: {
      sent: sentB,
      opened: Number(resultsB[0].opened),
      clicked: Number(resultsB[0].clicked),
      openRate: (Number(resultsB[0].opened) / sentB) * 100,
      clickRate: (Number(resultsB[0].clicked) / sentB) * 100,
    },
    winner: null, // To be calculated based on statistical significance
  };
}
