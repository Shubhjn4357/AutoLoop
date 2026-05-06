import { db } from "@/lib/db/client";
import {
  automations,
  automationMetrics,
  contacts,
  instagramAccounts,
  messages as dbMessages,
  scheduledMessages,
} from "@/lib/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  getInstagramUserProfile,
  sendInstagramMessage,
  replyToInstagramComment,
} from "@/lib/instagram/client";
import { createNotificationLog } from "@/lib/notifications/logs";
import { matchesAutomationCondition } from "@/lib/automation/rules";

async function interpolateVariables(
  text: string,
  userId: string,
  igUserId: string,
  recipientId: string
): Promise<string> {
  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.userId, userId),
      eq(contacts.igUserId, igUserId),
      eq(contacts.senderId, recipientId)
    ),
  });

  const lastMsg = await db.query.messages.findFirst({
    where: and(
      eq(dbMessages.userId, userId),
      eq(dbMessages.senderId, recipientId),
      eq(dbMessages.direction, "inbound")
    ),
    orderBy: [desc(dbMessages.timestamp)],
  });

  return text
    .replace(/\{\{\s*first_name\s*\}\}/gi, contact?.name?.split(" ")[0] ?? "there")
    .replace(/\{\{\s*name\s*\}\}/gi, contact?.name ?? "there")
    .replace(/\{\{\s*username\s*\}\}/gi, contact?.username ?? "")
    .replace(/\{\{\s*last_message\s*\}\}/gi, lastMsg?.text ?? "");
}

async function upsertContact(
  userId: string,
  igUserId: string,
  senderId: string,
  accessToken: string
) {
  try {
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.userId, userId),
        eq(contacts.igUserId, igUserId),
        eq(contacts.senderId, senderId)
      ),
    });

    let profile: Awaited<ReturnType<typeof getInstagramUserProfile>> | null = null;
    try {
      profile = await getInstagramUserProfile(senderId, accessToken);
    } catch {
      // silently fail — profile fetch is best-effort
    }

    if (existing) {
      await db
        .update(contacts)
        .set({
          lastSeenAt: new Date(),
          username: profile?.username ?? existing.username,
          name: profile?.name ?? existing.name,
          profilePic: profile?.profile_pic ?? existing.profilePic,
          isFollower: profile?.is_user_follow_business ?? existing.isFollower,
        })
        .where(eq(contacts.id, existing.id));
    } else {
      await db.insert(contacts).values({
        id: crypto.randomUUID(),
        userId,
        igUserId,
        senderId,
        username: profile?.username ?? null,
        name: profile?.name ?? null,
        profilePic: profile?.profile_pic ?? null,
        isFollower: profile?.is_user_follow_business ?? false,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        status: "automated",
      });
    }
  } catch (err) {
    console.error("[Engine] Contact upsert failed:", err);
  }
}

async function trackAutomationSend(userId: string, automationId: string) {
  try {
    const existing = await db.query.automationMetrics.findFirst({
      where: and(
        eq(automationMetrics.userId, userId),
        eq(automationMetrics.automationId, automationId)
      ),
    });
    if (existing) {
      await db
        .update(automationMetrics)
        .set({
          sendCount: existing.sendCount + 1,
          lastSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(automationMetrics.id, existing.id));
    } else {
      await db.insert(automationMetrics).values({
        id: crypto.randomUUID(),
        userId,
        automationId,
        sendCount: 1,
        replyCount: 0,
        lastSentAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.error("[Engine] Metric tracking failed:", err);
  }
}

interface EngineParams {
  igUserId: string;
  senderId: string;
  text: string;
  storyId?: string;
}

export async function processInstagramMessage({ igUserId, senderId, text, storyId }: EngineParams) {
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

  await upsertContact(igAccount.userId, igUserId, senderId, igAccount.accessToken);

  await createNotificationLog({
    userId: igAccount.userId,
    type: "message.received",
    title: "Incoming Instagram DM",
    message: `Message received from ${senderId}`,
    metadata: { igUserId, senderId, messageId },
  });

  const triggerType = storyId ? "story_reply" : "dm";
  const rules = await db.query.automations.findMany({
    where: and(
      eq(automations.userId, igAccount.userId),
      eq(automations.triggerType, triggerType)
    )
  });

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Match targetPostId
    try {
      const flow = JSON.parse(rule.flowJson ?? "{}");
      const ruleTargetPostId = flow.targetPostId;
      // If rule specifies a target post/story, it must match the incoming one
      if (ruleTargetPostId && ruleTargetPostId !== storyId) continue;
    } catch {
      // If flowJson is invalid, assume no target filter
    }

    const didMatch = matchesAutomationCondition(
      rule.conditionOperator,
      rule.condition,
      text
    );

    if (!didMatch) continue;

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
        console.error("Follower check failed:", error);
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
      dmTemplate: rule.dmTemplate,
      targetUrl: rule.targetUrl,
      ruleName: rule.name,
      userId: igAccount.userId,
      triggerType: rule.triggerType,
      flowJson: rule.flowJson,
    });
    return;
  }
}

export async function processInstagramComment({ 
  igUserId, 
  senderId, 
  text,
  mediaId,
  commentId
}: EngineParams & { mediaId: string; commentId: string }) {
  const igAccount = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.igUserId, igUserId),
  });

  if (!igAccount || !igAccount.accessToken) return;

  await createNotificationLog({
    userId: igAccount.userId,
    type: "comment.received",
    title: "New Instagram Comment",
    message: `Comment from ${senderId}: "${text}"`,
    metadata: { igUserId, senderId, mediaId, commentId },
  });

  const rules = await db.query.automations.findMany({
    where: and(
      eq(automations.userId, igAccount.userId),
      eq(automations.triggerType, "comment")
    )
  });

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Match targetPostId
    try {
      const flow = JSON.parse(rule.flowJson ?? "{}");
      const ruleTargetPostId = flow.targetPostId;
      // If rule specifies a target post, it must match the incoming mediaId
      if (ruleTargetPostId && ruleTargetPostId !== mediaId) continue;
    } catch {
      // If flowJson is invalid, assume no target filter
    }

    const didMatch = matchesAutomationCondition(
      rule.conditionOperator,
      rule.condition,
      text
    );

    if (!didMatch) continue;

    await executeAutomation({
      accessToken: igAccount.accessToken,
      automationId: rule.id,
      followUpDelayMinutes: rule.followUpDelayMinutes ?? 0,
      followUpTemplate: rule.followUpTemplate,
      igUserId,
      recipientId: senderId,
      responseTemplate: rule.responseTemplate,
      dmTemplate: rule.dmTemplate,
      targetUrl: rule.targetUrl,
      ruleName: rule.name,
      userId: igAccount.userId,
      commentId,
      triggerType: rule.triggerType,
      flowJson: rule.flowJson,
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
  dmTemplate: string | null;
  targetUrl: string | null;
  followUpTemplate: string | null;
  followUpDelayMinutes: number;
  accessToken: string;
  commentId?: string;
  triggerType?: string;
  flowJson?: string | null;
}

interface ParsedNode {
  id: string;
  type: string;
  config?: {
    text?: string;
    delayMinutes?: number;
    [key: string]: unknown;
  };
}

async function executeAutomation({
  accessToken,
  automationId,
  followUpDelayMinutes,
  followUpTemplate,
  igUserId,
  recipientId,
  responseTemplate,
  dmTemplate,
  targetUrl,
  ruleName,
  userId,
  commentId,
  triggerType,
  flowJson,
}: ExecuteAutomationParams) {
  try {
    // Check for new flow nodes
    let nodes: ParsedNode[] = [];
    if (flowJson) {
      try {
        const parsed = JSON.parse(flowJson);
        if (Array.isArray(parsed)) {
          nodes = parsed;
        }
      } catch (e) {
        console.error("Failed to parse flowJson", e);
      }
    }

    // If we have actual flow nodes (not just the legacy targetPostId object)
    const flowSteps = nodes.filter(n => n && n.type && n.id);

    if (flowSteps.length > 0) {
      // We process the first node immediately.
      // A full implementation would track current state in automationState
      // and iterate until a delay or wait condition is hit.
      // For now, let's sequentially execute all non-blocking nodes.
      for (const node of flowSteps) {
        if (node.type === "reply" || node.type === "text") {
          const rawText = node.config?.text || responseTemplate;
          const text = await interpolateVariables(rawText, userId, igUserId, recipientId);
          if (commentId && triggerType === "comment") {
            await replyToInstagramComment(commentId, text, accessToken);
          } else {
            await sendInstagramMessage(igUserId, recipientId, text, accessToken);
            await db.insert(dbMessages).values({
              id: crypto.randomUUID(),
              userId,
              igUserId,
              senderId: recipientId,
              automationId,
              direction: "outbound",
              status: "sent",
              text,
              timestamp: new Date(),
            });
          }
        }
        if (node.type === "delay") {
          // schedule remaining nodes and break
          break;
        }
      }

      await trackAutomationSend(userId, automationId);

      await createNotificationLog({
        userId,
        type: "automation.sent",
        title: "Flow executed",
        message: `${ruleName} flow executed for ${recipientId}`,
        status: "success",
        metadata: { automationId, igUserId, recipientId, commentId },
      });
      return;
    }

    // Legacy fallback behavior
    let didSend = false;

    // 1. Handle Public Comment Reply if triggered by a comment
    if (commentId && triggerType === "comment") {
      const interpolatedResponse = await interpolateVariables(responseTemplate, userId, igUserId, recipientId);
      await replyToInstagramComment(commentId, interpolatedResponse, accessToken);
      didSend = true;
    }

    // 2. Handle Private DM if dmTemplate is provided
    let finalDmText = dmTemplate || (triggerType === "dm" ? responseTemplate : null);
    if (finalDmText) {
      finalDmText = await interpolateVariables(finalDmText, userId, igUserId, recipientId);
    }

    if (finalDmText) {
      if (targetUrl) {
        finalDmText += `\n\n${targetUrl}`;
      }

      await sendInstagramMessage(igUserId, recipientId, finalDmText, accessToken);

      await db.insert(dbMessages).values({
        id: crypto.randomUUID(),
        userId,
        igUserId,
        senderId: recipientId,
        automationId,
        direction: "outbound",
        status: "sent",
        text: finalDmText,
        timestamp: new Date(),
      });
      didSend = true;
    }

    if (didSend) {
      await trackAutomationSend(userId, automationId);
    }

    await createNotificationLog({
      userId,
      type: "automation.sent",
      title: "Automation executed",
      message: `${ruleName} replied to ${recipientId}`,
      status: "success",
      metadata: { automationId, igUserId, recipientId, commentId },
    });

    if (followUpTemplate?.trim()) {
      const interpolatedFollowUp = await interpolateVariables(followUpTemplate.trim(), userId, igUserId, recipientId);
      const delayMinutes = Math.max(0, followUpDelayMinutes);
      await db.insert(scheduledMessages).values({
        id: crypto.randomUUID(),
        userId,
        automationId,
        igUserId,
        recipientId,
        messageText: interpolatedFollowUp,
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
