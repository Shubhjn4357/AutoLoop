import { db } from "@/lib/db/client";
import {
  automations,
  instagramAccounts,
  messages as dbMessages,
  scheduledMessages,
} from "@/lib/db/schema";
import { and, asc, eq, lte } from "drizzle-orm";
import {
  getInstagramUserProfile,
  sendInstagramMessage,
} from "@/lib/instagram/client";
import { createNotificationLog } from "@/lib/notifications/logs";
import { matchesAutomationCondition } from "@/lib/automation/rules";

interface EngineParams {
  igUserId: string;
  senderId: string;
  text: string;
}

export async function processInstagramMessage({ igUserId, senderId, text }: EngineParams) {
  const messageId = crypto.randomUUID();

  await db.insert(dbMessages).values({
    id: messageId,
    igUserId,
    senderId,
    direction: "inbound",
    status: "received",
    text,
    timestamp: new Date(),
  });

  const igAccount = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.igUserId, igUserId),
  });

  if (!igAccount || !igAccount.accessToken) {
    console.error("[Engine] No system user/token found for IG user:", igUserId);
    return;
  }

  await db
    .update(dbMessages)
    .set({ userId: igAccount.userId })
    .where(eq(dbMessages.id, messageId));

  await createNotificationLog({
    userId: igAccount.userId,
    type: "message.received",
    title: "Incoming Instagram DM",
    message: `Message received from ${senderId}`,
    metadata: { igUserId, senderId, messageId },
  });

  const rules = await db.query.automations.findMany({
    where: eq(automations.userId, igAccount.userId)
  });

  for (const rule of rules) {
    if (!rule.isActive) {
      continue;
    }

    const didMatch = matchesAutomationCondition(
      rule.conditionOperator,
      rule.condition,
      text
    );

    if (!didMatch) {
      continue;
    }

    if (rule.requireFollower) {
      try {
        const profile = await getInstagramUserProfile(senderId, igAccount.accessToken);
        if (profile.is_user_follow_business !== true) {
          await createNotificationLog({
            userId: igAccount.userId,
            type: "automation.skipped",
            title: "Follower condition did not pass",
            message: `${rule.name} matched, but the sender does not currently follow this business account.`,
            status: "warning",
            metadata: { automationId: rule.id, senderId, profile },
          });
          continue;
        }
      } catch (error) {
        await createNotificationLog({
          userId: igAccount.userId,
          type: "automation.error",
          title: "Follower check failed",
          message: error instanceof Error ? error.message : "Instagram profile lookup failed.",
          status: "error",
          metadata: { automationId: rule.id, senderId },
        });
        continue;
      }
    }

    await executeAutomation({
      accessToken: igAccount.accessToken,
      automationId: rule.id,
      followUpDelayMinutes: rule.followUpDelayMinutes ?? 0,
      followUpTemplate: rule.followUpTemplate,
      igUserId,
      recipientId: senderId,
      responseTemplate: rule.responseTemplate,
      ruleName: rule.name,
      userId: igAccount.userId,
    });
    return;
  }
}

interface ExecuteAutomationParams {
  userId: string;
  automationId: string;
  ruleName: string;
  igUserId: string;
  recipientId: string;
  responseTemplate: string;
  followUpTemplate: string | null;
  followUpDelayMinutes: number;
  accessToken: string;
}

async function executeAutomation({
  accessToken,
  automationId,
  followUpDelayMinutes,
  followUpTemplate,
  igUserId,
  recipientId,
  responseTemplate,
  ruleName,
  userId,
}: ExecuteAutomationParams) {
  try {
    await sendInstagramMessage(igUserId, recipientId, responseTemplate, accessToken);

    await db.insert(dbMessages).values({
      id: crypto.randomUUID(),
      userId,
      igUserId,
      senderId: recipientId,
      automationId,
      direction: "outbound",
      status: "sent",
      text: responseTemplate,
      timestamp: new Date(),
    });

    await createNotificationLog({
      userId,
      type: "automation.sent",
      title: "Automation reply sent",
      message: `${ruleName} replied to ${recipientId}`,
      status: "success",
      metadata: { automationId, igUserId, recipientId },
    });

    if (followUpTemplate?.trim()) {
      const delayMinutes = Math.max(0, followUpDelayMinutes);
      await db.insert(scheduledMessages).values({
        id: crypto.randomUUID(),
        userId,
        automationId,
        igUserId,
        recipientId,
        messageText: followUpTemplate.trim(),
        status: "pending",
        attempts: 0,
        dueAt: new Date(Date.now() + delayMinutes * 60_000),
      });

      await createNotificationLog({
        userId,
        type: "follow_up.scheduled",
        title: "Follow-up scheduled",
        message: `${ruleName} follow-up is queued for ${delayMinutes} minute(s).`,
        metadata: { automationId, igUserId, recipientId, delayMinutes },
      });
    }
  } catch (error) {
    await createNotificationLog({
      userId,
      type: "automation.error",
      title: "Automation send failed",
      message: error instanceof Error ? error.message : "Instagram send failed.",
      status: "error",
      metadata: { automationId, igUserId, recipientId },
    });
    throw error;
  }
}

export async function processDueFollowUps(now = new Date()) {
  const dueMessages = await db.query.scheduledMessages.findMany({
    where: and(
      eq(scheduledMessages.status, "pending"),
      lte(scheduledMessages.dueAt, now)
    ),
    orderBy: [asc(scheduledMessages.dueAt)],
    limit: 25,
  });

  for (const dueMessage of dueMessages) {
    const igAccount = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.userId, dueMessage.userId),
        eq(instagramAccounts.igUserId, dueMessage.igUserId)
      ),
    });

    if (!igAccount?.accessToken) {
      await db
        .update(scheduledMessages)
        .set({
          attempts: dueMessage.attempts + 1,
          lastError: "Instagram account is no longer connected.",
          status: "failed",
        })
        .where(eq(scheduledMessages.id, dueMessage.id));
      continue;
    }

    try {
      await sendInstagramMessage(
        dueMessage.igUserId,
        dueMessage.recipientId,
        dueMessage.messageText,
        igAccount.accessToken
      );

      await db.insert(dbMessages).values({
        id: crypto.randomUUID(),
        userId: dueMessage.userId,
        igUserId: dueMessage.igUserId,
        senderId: dueMessage.recipientId,
        automationId: dueMessage.automationId,
        direction: "outbound",
        status: "sent",
        text: dueMessage.messageText,
        timestamp: new Date(),
      });

      await db
        .update(scheduledMessages)
        .set({
          status: "sent",
          sentAt: new Date(),
          attempts: dueMessage.attempts + 1,
          lastError: null,
        })
        .where(eq(scheduledMessages.id, dueMessage.id));

      await createNotificationLog({
        userId: dueMessage.userId,
        type: "follow_up.sent",
        title: "Follow-up sent",
        message: `Follow-up delivered to ${dueMessage.recipientId}`,
        status: "success",
        metadata: { scheduledMessageId: dueMessage.id },
      });
    } catch (error) {
      const attempts = dueMessage.attempts + 1;
      await db
        .update(scheduledMessages)
        .set({
          attempts,
          lastError: error instanceof Error ? error.message : "Unknown send error",
          status: attempts >= 3 ? "failed" : "pending",
          dueAt: attempts >= 3 ? dueMessage.dueAt : new Date(Date.now() + 5 * 60_000),
        })
        .where(eq(scheduledMessages.id, dueMessage.id));

      await createNotificationLog({
        userId: dueMessage.userId,
        type: "follow_up.error",
        title: "Follow-up failed",
        message: error instanceof Error ? error.message : "Instagram send failed.",
        status: "error",
        metadata: { scheduledMessageId: dueMessage.id, attempts },
      });
    }
  }

  return { processed: dueMessages.length };
}
