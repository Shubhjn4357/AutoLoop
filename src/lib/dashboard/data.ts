import { cache } from "react";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  automations,
  socialAccounts,
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
  try {
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
        db.query.socialAccounts.findMany({
          where: eq(socialAccounts.userId, userId),
        }),
        db
          .select({ value: count() })
          .from(scheduledMessages)
          .where(and(eq(scheduledMessages.userId, userId), eq(scheduledMessages.status, "pending"))),
        getNotificationLogs(userId, 8),
      ]);

    const externalIds = accounts
      .map((account) => account.externalId)
      .filter((id): id is string => Boolean(id));

    const [messageCount, recentMessages] =
      externalIds.length > 0
        ? await Promise.all([
            db
              .select({ value: count() })
              .from(dbMessages)
              .where(inArray(dbMessages.externalId, externalIds)),
            db.query.messages.findMany({
              where: inArray(dbMessages.externalId, externalIds),
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
  } catch (error) {
    console.error("[Dashboard Data] Fetch failed:", error);
    // Return empty fallback data
    return {
      activeAutomationCount: 0,
      automationCount: 0,
      chartData: trailingDays(7).map(d => ({ date: chartLabel(d), messages: 0 })),
      connectionCount: 0,
      messageCount: 0,
      pendingFollowUpCount: 0,
      recentLogs: [],
    };
  }
});
