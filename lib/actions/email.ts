/**
 * Email Server Actions
 * Handles all email-related data fetching and operations
 */

"use server";

import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function getEmailStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const stats = await db.select({
    total: sql<number>`count(*)`,
    sent: sql<number>`sum(case when ${emailLogs.status} = 'sent' then 1 else 0 end)`,
    delivered: sql<number>`sum(case when ${emailLogs.status} = 'delivered' then 1 else 0 end)`,
    opened: sql<number>`sum(case when ${emailLogs.status} = 'opened' then 1 else 0 end)`,
    clicked: sql<number>`sum(case when ${emailLogs.status} = 'clicked' then 1 else 0 end)`,
    failed: sql<number>`sum(case when ${emailLogs.status} = 'failed' then 1 else 0 end)`,
  })
    .from(emailLogs)
    .where(eq(emailLogs.userId, session.user.id));

  const data = stats[0];
  const totalSent = Number(data.sent) + Number(data.delivered) + Number(data.opened) + Number(data.clicked);

  return {
    ...data,
    openRate: totalSent > 0 ? (Number(data.opened) / totalSent * 100).toFixed(1) : "0.0",
    clickRate: totalSent > 0 ? (Number(data.clicked) / totalSent * 100).toFixed(1) : "0.0",
  };
}

export async function getEmailMetricsHistory(days = 7) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const history = await db.execute(sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
      SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked
    FROM email_logs
    WHERE user_id = ${session.user.id}
    AND created_at > NOW() - INTERVAL '${sql.raw(days.toString())} days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return history.rows as unknown as Array<{ date: string; total: number; opened: number; clicked: number }>;
}
