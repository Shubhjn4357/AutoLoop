import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { messages, automations, contacts, scheduledMessages, socialAccounts, automationMetrics } from "@/lib/db/schema";
import { and, count, desc, eq, gte } from "drizzle-orm";

function trailingDays(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return date;
  });
}

function chartLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId || userId !== session.user.id) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 403 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const [
      totalMessages,
      inboundMessages,
      outboundMessages,
      automationTriggers,
      totalContacts,
      newContacts,
      pendingFollowUps,
      activeAutomations,
      recentMessages,
      igAccounts,
    ] = await Promise.all([
      db.select({ value: count() }).from(messages).where(eq(messages.userId, userId)),
      db.select({ value: count() }).from(messages).where(and(eq(messages.userId, userId), eq(messages.direction, "inbound"))),
      db.select({ value: count() }).from(messages).where(and(eq(messages.userId, userId), eq(messages.direction, "outbound"))),
      db.select({ value: count() }).from(automationMetrics).where(eq(automationMetrics.userId, userId)),
      db.select({ value: count() }).from(contacts).where(eq(contacts.userId, userId)),
      db.select({ value: count() }).from(contacts).where(and(eq(contacts.userId, userId), gte(contacts.firstSeenAt, sevenDaysAgo))),
      db.select({ value: count() }).from(scheduledMessages).where(and(eq(scheduledMessages.userId, userId), eq(scheduledMessages.status, "pending"))),
      db.select({ value: count() }).from(automations).where(and(eq(automations.userId, userId), eq(automations.isActive, true))),
      db.query.messages.findMany({
        where: eq(messages.userId, userId),
        orderBy: [desc(messages.timestamp)],
        limit: 500,
      }),
      db.query.socialAccounts.findMany({
        where: eq(socialAccounts.userId, userId),
      }),
    ]);

    const days = trailingDays(7);
    const messagesByDay = days.map((day) => ({
      date: chartLabel(day),
      inbound: 0,
      outbound: 0,
    }));

    for (const msg of recentMessages) {
      const timestamp = new Date(msg.timestamp);
      timestamp.setHours(0, 0, 0, 0);
      const index = days.findIndex((d) => d.getTime() === timestamp.getTime());
      if (index >= 0) {
        if (msg.direction === "inbound") {
          messagesByDay[index].inbound++;
        } else {
          messagesByDay[index].outbound++;
        }
      }
    }

    return NextResponse.json({
      totalMessages: totalMessages[0]?.value ?? 0,
      inboundMessages: inboundMessages[0]?.value ?? 0,
      outboundMessages: outboundMessages[0]?.value ?? 0,
      automationTriggers: automationTriggers[0]?.value ?? 0,
      totalContacts: totalContacts[0]?.value ?? 0,
      newContactsThisWeek: newContacts[0]?.value ?? 0,
      pendingFollowUps: pendingFollowUps[0]?.value ?? 0,
      activeAutomations: activeAutomations[0]?.value ?? 0,
      messagesByDay,
      connectedAccounts: igAccounts.length,
    });
  } catch (err) {
    console.error("[AppInsights] Failed to fetch metrics:", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
