import { cache } from "react";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  automations,
  instagramAccounts,
  messages as dbMessages,
  scheduledMessages,
} from "@/lib/db/schema";
import { getNotificationLogs } from "@/lib/notifications/logs";

function trailingDays(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return date;
  });
}

function chartLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const getDashboardData = cache(async (userId: string) => {
  const [automationCount, activeAutomationCount, accounts, pendingFollowUps, logs] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(automations)
        .where(eq(automations.userId, userId)),
      db
        .select({ value: count() })
        .from(automations)
        .where(and(eq(automations.userId, userId), eq(automations.isActive, true))),
      db.query.instagramAccounts.findMany({
        where: eq(instagramAccounts.userId, userId),
      }),
      db
        .select({ value: count() })
        .from(scheduledMessages)
        .where(and(eq(scheduledMessages.userId, userId), eq(scheduledMessages.status, "pending"))),
      getNotificationLogs(userId, 8),
    ]);

  const igUserIds = accounts
    .map((account) => account.igUserId)
    .filter((id): id is string => Boolean(id));

  const [messageCount, recentMessages] =
    igUserIds.length > 0
      ? await Promise.all([
          db
            .select({ value: count() })
            .from(dbMessages)
            .where(inArray(dbMessages.igUserId, igUserIds)),
          db.query.messages.findMany({
            where: inArray(dbMessages.igUserId, igUserIds),
            orderBy: [desc(dbMessages.timestamp)],
            limit: 500,
          }),
        ])
      : [[{ value: 0 }], []];

  const days = trailingDays(7);
  const chartData = days.map((day) => ({
    date: chartLabel(day),
    messages: 0,
  }));

  for (const message of recentMessages) {
    const timestamp = new Date(message.timestamp);
    timestamp.setHours(0, 0, 0, 0);
    const index = days.findIndex((day) => day.getTime() === timestamp.getTime());
    if (index >= 0) {
      chartData[index].messages += 1;
    }
  }

  return {
    activeAutomationCount: activeAutomationCount[0]?.value ?? 0,
    automationCount: automationCount[0]?.value ?? 0,
    chartData,
    connectionCount: accounts.length,
    messageCount: messageCount[0]?.value ?? 0,
    pendingFollowUpCount: pendingFollowUps[0]?.value ?? 0,
    recentLogs: logs,
  };
});
