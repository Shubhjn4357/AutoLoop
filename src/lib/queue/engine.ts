// Queue-based Automation Engine - Cloudflare-Native Architecture
// Events are queued and processed asynchronously for reliability

import { db } from "@/lib/db/client";
import {
  automations,
  messages as dbMessages,
  socialAccounts,
  contacts,
  scheduledMessages,
  eventQueue,
  rateLimitState,
  analyticsEvents,
  aiConversations,
} from "@/lib/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  sendInstagramMessage,
  replyToInstagramComment,
  getInstagramUserProfile,
} from "@/lib/instagram/client";
import { createNotificationLog } from "@/lib/notifications/logs";
import { matchesAutomationCondition } from "@/lib/automation/rules";
import { analyzeSentiment, generateSmartReply } from "@/lib/ai";

// Rate limits per Instagram account
const RATE_LIMITS = {
  dmPerMinute: 15,
  dmPerHour: 150,
  dmPerDay: 500,
};

// Generate idempotency key
function generateIdempotencyKey(
  externalId: string,
  recipientId: string,
  automationId: string | null,
  eventType: string
): string {
  return `${externalId}:${recipientId}:${automationId ?? 'none'}:${eventType}:${Math.floor(Date.now() / 1000 / 60)}`;
}

// Check and update rate limits
async function checkRateLimits(externalId: string, recipientId: string, cooldownMinutes: number = 5): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get or create rate limit state
  let state = await db.query.rateLimitState.findFirst({
    where: eq(rateLimitState.externalId, externalId),
  });

  if (!state) {
    await db.insert(rateLimitState).values({
      id: crypto.randomUUID(),
      externalId,
      dmCountMinute: 0,
      dmCountHour: 0,
      dmCountDay: 0,
      dmWindowStart: now,
      lastSendToRecipient: "{}",
    });
    state = await db.query.rateLimitState.findFirst({
      where: eq(rateLimitState.externalId, externalId),
    });
  }

  if (!state) return { allowed: false, reason: "Rate limit state error" };

  // Reset counters if windows have passed
  const windowStart = state.dmWindowStart ?? oneDayAgo;
  let newCountMinute = state.dmCountMinute ?? 0;
  let newCountHour = state.dmCountHour ?? 0;
  let newCountDay = state.dmCountDay ?? 0;

  if (new Date(windowStart) < oneMinuteAgo) newCountMinute = 0;
  if (new Date(windowStart) < oneHourAgo) newCountHour = 0;
  if (new Date(windowStart) < oneDayAgo) {
    newCountDay = 0;
    newCountHour = 0;
    newCountMinute = 0;
  }

  // Check global rate limits
  if (newCountMinute >= RATE_LIMITS.dmPerMinute) {
    return { allowed: false, reason: "Rate limit: max 15 DMs/minute" };
  }
  if (newCountHour >= RATE_LIMITS.dmPerHour) {
    return { allowed: false, reason: "Rate limit: max 150 DMs/hour" };
  }
  if (newCountDay >= RATE_LIMITS.dmPerDay) {
    return { allowed: false, reason: "Rate limit: max 500 DMs/day" };
  }

  // Check per-recipient cooldown
  const lastSendMap = JSON.parse(state.lastSendToRecipient ?? "{}") as Record<string, number>;
  const lastSend = lastSendMap[recipientId];
  if (lastSend) {
    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (now.getTime() - lastSend < cooldownMs) {
      return { allowed: false, reason: `Cooldown: ${cooldownMinutes}min between sends to same user` };
    }
  }

  // Update rate limits
  lastSendMap[recipientId] = now.getTime();
  await db
    .update(rateLimitState)
    .set({
      dmCountMinute: newCountMinute + 1,
      dmCountHour: newCountHour + 1,
      dmCountDay: newCountDay + 1,
      dmWindowStart: now,
      lastSendToRecipient: JSON.stringify(lastSendMap),
      updatedAt: now,
    })
    .where(eq(rateLimitState.id, state.id));

  return { allowed: true };
}

// Queue a new event for processing
export async function queueEvent(params: {
  eventType: string;
  payload: unknown;
  externalId: string;
  recipientId: string;
  scheduledFor?: Date;
  idempotencyKey?: string;
}): Promise<{ success: boolean; queuedId?: string; error?: string }> {
  try {
    const idempotencyKey = params.idempotencyKey ?? generateIdempotencyKey(
      params.externalId,
      params.recipientId,
      null,
      params.eventType
    );

    // Check for duplicate
    const existing = await db.query.eventQueue.findFirst({
      where: eq(eventQueue.idempotencyKey, idempotencyKey),
    });

    if (existing && existing.status !== "failed") {
      return { success: true, queuedId: existing.id, error: "Duplicate event - already queued" };
    }

    const queuedId = crypto.randomUUID();
    await db.insert(eventQueue).values({
      id: queuedId,
      eventType: params.eventType,
      payload: JSON.stringify(params.payload),
      externalId: params.externalId,
      recipientId: params.recipientId,
      scheduledFor: params.scheduledFor ?? new Date(),
      idempotencyKey,
      status: "pending",
    });

    return { success: true, queuedId };
  } catch (error) {
    console.error("[Queue] Failed to queue event:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Process webhook event - queues for async processing
export async function processWebhookEvent(body: unknown): Promise<{ success: boolean; queued: number }> {
  const payload = body as {
    object?: string;
    entry?: Array<{
      id: string;
      messaging?: Array<{
        sender: { id: string };
        recipient: { id: string };
        message?: {
          text?: string;
          is_echo?: boolean;
          reply_to?: { story?: { id: string } };
        };
        timestamp?: number;
      }>;
      changes?: Array<{
        field: string;
        value: {
          id: string;
          from: { id: string };
          text: string;
          media?: { id: string };
          parent_id?: string;
        };
      }>;
    }>;
  };

  if (payload.object !== "instagram" || !payload.entry) {
    return { success: false, queued: 0 };
  }

  let queued = 0;

  for (const entry of payload.entry) {
    const externalId = entry.id;

    // Handle DMs
    if (entry.messaging) {
      for (const msg of entry.messaging) {
        if (msg.message?.is_echo) continue;
        if (!msg.message?.text) continue;

        const result = await queueEvent({
          eventType: msg.message.reply_to?.story ? "story_reply" : "dm",
          payload: {
            externalId,
            senderId: msg.sender.id,
            text: msg.message.text,
            storyId: msg.message.reply_to?.story?.id,
            timestamp: msg.timestamp,
          },
          externalId,
          recipientId: msg.sender.id,
        });

        if (result.success) queued++;
      }
    }

    // Handle Comments
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field !== "comments") continue;
        const val = change.value;
        if (val.parent_id) continue; // Skip replies to comments

        const result = await queueEvent({
          eventType: "comment",
          payload: {
            externalId,
            senderId: val.from.id,
            text: val.text,
            mediaId: val.media?.id,
            commentId: val.id,
          },
          externalId,
          recipientId: val.from.id,
        });

        if (result.success) queued++;
      }
    }
  }

  return { success: true, queued };
}

// Process a single queued event
export async function processQueuedEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const event = await db.query.eventQueue.findFirst({
    where: eq(eventQueue.id, eventId),
  });

  if (!event) return { success: false, error: "Event not found" };
  if (event.status === "completed") return { success: true };
  if (event.attempts >= (event.maxAttempts ?? 3)) {
    await db.update(eventQueue).set({ status: "failed" }).where(eq(eventQueue.id, eventId));
    return { success: false, error: "Max attempts exceeded" };
  }

  // Mark as processing
  await db
    .update(eventQueue)
    .set({
      status: "processing",
      attempts: event.attempts + 1,
    })
    .where(eq(eventQueue.id, eventId));

  try {
    const payload = JSON.parse(event.payload);

    switch (event.eventType) {
      case "dm":
      case "story_reply":
        await handleDMEvent(payload, event.eventType);
        break;
      case "comment":
        await handleCommentEvent(payload);
        break;
      case "dm_send":
        await handleDirectSend(payload);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }

    // Mark as completed
    await db
      .update(eventQueue)
      .set({
        status: "completed",
        processedAt: new Date(),
      })
      .where(eq(eventQueue.id, eventId));

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    // Schedule retry with exponential backoff
    const delayMinutes = Math.pow(2, event.attempts); // 1, 2, 4, 8... minutes
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

    await db
      .update(eventQueue)
      .set({
        status: event.attempts >= (event.maxAttempts ?? 3) ? "failed" : "pending",
        lastError: errorMsg,
        scheduledFor,
      })
      .where(eq(eventQueue.id, eventId));

    return { success: false, error: errorMsg };
  }
}

// Handle DM/Story reply events
async function handleDMEvent(
  payload: {
    externalId: string;
    senderId: string;
    text: string;
    storyId?: string;
    timestamp?: number;
  },
  eventType: string
) {
  const { externalId, senderId, text, storyId } = payload;

  // Find Instagram account
  const igAccount = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.externalId, externalId),
  });

  if (!igAccount?.accessToken) {
    throw new Error("Instagram account not found or not connected");
  }

  // Store incoming message
  const messageId = crypto.randomUUID();
  await db.insert(dbMessages).values({
    id: messageId,
    userId: igAccount.userId,
    externalId,
    senderId,
    direction: "inbound",
    status: "received",
    text,
    timestamp: new Date(payload.timestamp ?? Date.now()),
  });

  // Analyze sentiment
  const { sentiment } = await analyzeSentiment(text);
  await db.update(dbMessages).set({ sentiment }).where(eq(dbMessages.id, messageId));

  // Upsert contact
  await upsertContact(igAccount.userId, externalId, senderId, igAccount.accessToken);

  // Log notification
  await createNotificationLog({
    userId: igAccount.userId,
    type: "message.received",
    title: "Incoming Instagram DM",
    message: `Message received from ${senderId}: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
    metadata: { externalId, senderId, messageId, sentiment },
  });

  // Track analytics
  await trackAnalytics({
    userId: igAccount.userId,
    eventType: eventType === "story_reply" ? "story_reply_received" : "dm_received",
    externalId,
    recipientId: senderId,
    metadata: { sentiment },
  });

  // Find matching automations
  const triggerType = eventType;
  const rules = await db.query.automations.findMany({
    where: and(
      eq(automations.userId, igAccount.userId),
      eq(automations.triggerType, triggerType),
      eq(automations.isActive, true)
    ),
    orderBy: [desc(automations.priority)],
  });

  for (const rule of rules) {
    // Check post targeting
    if (rule.targetPostId && rule.targetPostId !== storyId) continue;

    // Check condition match
    const didMatch = matchesAutomationCondition(rule.conditionOperator, rule.condition, text);
    if (!didMatch) continue;

    // Check follower requirement
    if (rule.requireFollower) {
      const profile = await getInstagramUserProfile(senderId, igAccount.accessToken);
      if (!profile.is_user_follow_business) {
        await createNotificationLog({
          userId: igAccount.userId,
          type: "automation.skipped",
          title: "Follower check failed",
          message: `${rule.name} matched but user doesn't follow`,
          status: "warning",
          metadata: { automationId: rule.id, senderId },
        });
        continue;
      }
    }

    // Check rate limits
    const rateCheck = await checkRateLimits(externalId, senderId, rule.cooldownMinutes ?? 5);
    if (!rateCheck.allowed) {
      await createNotificationLog({
        userId: igAccount.userId,
        type: "automation.rate_limited",
        title: "Rate limited",
        message: rateCheck.reason ?? "Rate limit exceeded",
        status: "warning",
        metadata: { automationId: rule.id, senderId },
      });
      continue;
    }

    // Execute automation
    await executeAutomation({
      rule,
      externalId,
      recipientId: senderId,
      accessToken: igAccount.accessToken,
      messageText: text,
      messageId,
    });

    return; // Only execute first matching rule
  }
}

// Handle comment events
async function handleCommentEvent(payload: {
  externalId: string;
  senderId: string;
  text: string;
  mediaId: string;
  commentId: string;
}) {
  const { externalId, senderId, text, mediaId, commentId } = payload;

  const igAccount = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.externalId, externalId),
  });

  if (!igAccount?.accessToken) {
    throw new Error("Instagram account not found");
  }

  // Log notification
  await createNotificationLog({
    userId: igAccount.userId,
    type: "comment.received",
    title: "New Instagram Comment",
    message: `Comment from ${senderId}: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
    metadata: { externalId, senderId, mediaId, commentId },
  });

  // Find matching automations
  const rules = await db.query.automations.findMany({
    where: and(
      eq(automations.userId, igAccount.userId),
      eq(automations.triggerType, "comment"),
      eq(automations.isActive, true)
    ),
    orderBy: [desc(automations.priority)],
  });

  for (const rule of rules) {
    // Check post targeting
    if (rule.targetPostId && rule.targetPostId !== mediaId) continue;

    // Check condition match
    const didMatch = matchesAutomationCondition(rule.conditionOperator, rule.condition, text);
    if (!didMatch) continue;

    // Execute automation with comment reply
    await executeAutomation({
      rule,
      externalId,
      recipientId: senderId,
      accessToken: igAccount.accessToken,
      messageText: text,
      commentId,
    });

    return;
  }
}

// Execute automation with AI support
interface ExecuteParams {
  rule: typeof automations.$inferSelect;
  externalId: string;
  recipientId: string;
  accessToken: string;
  messageText: string;
  messageId?: string;
  commentId?: string;
}

async function executeAutomation(params: ExecuteParams) {
  const { rule, externalId, recipientId, accessToken, messageText, commentId } = params;

  let dmContent = rule.dmTemplate;

  // AI-powered response if enabled
  if (rule.aiEnabled && rule.aiPrompt) {
    try {
      // Get conversation context
      const conversation = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.externalId, externalId),
          eq(aiConversations.recipientId, recipientId)
        ),
      });

      const aiResponse = await generateSmartReply({
        userMessage: messageText,
        prompt: rule.aiPrompt ?? undefined,
        context: conversation?.context ?? undefined,
      });

      if (aiResponse?.reply) {
        dmContent = aiResponse.reply;
      }

      // Update conversation context
      const newContext = JSON.stringify({
        history: [
          ...(conversation?.context ? JSON.parse(conversation.context).history : []).slice(-4),
          { role: "user", content: messageText },
          { role: "assistant", content: dmContent },
        ],
      });

      await db
        .insert(aiConversations)
        .values({
          id: crypto.randomUUID(),
          userId: rule.userId,
          externalId,
          recipientId,
          context: newContext,
          intent: aiResponse?.intent ?? "unknown",
          lastMessageAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [aiConversations.externalId, aiConversations.recipientId],
          set: {
            context: newContext,
            intent: aiResponse?.intent ?? "unknown",
            lastMessageAt: new Date(),
          },
        });
    } catch (error) {
      console.error("[AI] Failed to generate smart reply:", error);
      // Fall back to template
    }
  }

  // Interpolate variables
  const interpolatedDM = await interpolateVariables(dmContent, rule.userId, externalId, recipientId);
  const finalDM = rule.targetUrl
    ? `${interpolatedDM}\n\n${rule.targetUrl}`
    : interpolatedDM;

  // Send public comment reply if applicable
  if (commentId && rule.responseTemplate) {
    const interpolatedReply = await interpolateVariables(
      rule.responseTemplate,
      rule.userId,
      externalId,
      recipientId
    );
    await replyToInstagramComment(commentId, interpolatedReply, accessToken);
  }

  // Send DM
  await sendInstagramMessage(externalId, recipientId, finalDM, accessToken);

  // Store outbound message
  const outboundId = crypto.randomUUID();
  await db.insert(dbMessages).values({
    id: outboundId,
    userId: rule.userId,
    externalId,
    senderId: recipientId,
    automationId: rule.id,
    direction: "outbound",
    status: "sent",
    text: finalDM,
    timestamp: new Date(),
  });

  // Schedule follow-ups if configured
  if (rule.followUpTemplate) {
    await scheduleFollowUp({
      userId: rule.userId,
      automationId: rule.id,
      externalId,
      recipientId,
      template: rule.followUpTemplate,
      delayMinutes: rule.followUpDelayMinutes ?? 60,
    });
  }

  if (rule.followUp2Template) {
    await scheduleFollowUp({
      userId: rule.userId,
      automationId: rule.id,
      externalId,
      recipientId,
      template: rule.followUp2Template,
      delayMinutes: rule.followUp2DelayMinutes ?? 1440,
    });
  }

  // Track metrics
  await trackAutomationMetrics(rule.userId, rule.id);

  // Track analytics
  await trackAnalytics({
    userId: rule.userId,
    eventType: "automation_triggered",
    automationId: rule.id,
    externalId,
    recipientId,
  });

  // Log success
  await createNotificationLog({
    userId: rule.userId,
    type: "automation.sent",
    title: "Automation executed",
    message: `${rule.name} replied to ${recipientId}`,
    status: "success",
    metadata: { automationId: rule.id, externalId, recipientId },
  });
}

// Schedule a follow-up message
async function scheduleFollowUp(params: {
  userId: string;
  automationId: string;
  externalId: string;
  recipientId: string;
  template: string;
  delayMinutes: number;
}) {
  const { userId, automationId, externalId, recipientId, template, delayMinutes } = params;

  const dueAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await db.insert(scheduledMessages).values({
    id: crypto.randomUUID(),
    userId,
    automationId,
    externalId,
    recipientId,
    messageText: template,
    status: "pending",
    dueAt,
  });
}

// Process scheduled follow-ups
export async function processScheduledMessages(now = new Date()) {
  const dueMessages = await db.query.scheduledMessages.findMany({
    where: and(
      eq(scheduledMessages.status, "pending"),
      lte(scheduledMessages.dueAt, now)
    ),
    orderBy: [asc(scheduledMessages.dueAt)],
    limit: 25,
  });

  const results = { processed: 0, failed: 0 };

  for (const msg of dueMessages) {
    const igAccount = await db.query.socialAccounts.findFirst({
      where: and(
        eq(socialAccounts.userId, msg.userId),
        eq(socialAccounts.externalId, msg.externalId)
      ),
    });

    if (!igAccount?.accessToken) {
      await db
        .update(scheduledMessages)
        .set({
          status: "failed",
          lastError: "Account disconnected",
          attempts: (msg.attempts ?? 0) + 1,
        })
        .where(eq(scheduledMessages.id, msg.id));
      results.failed++;
      continue;
    }

    try {
      // Interpolate and send
      const interpolated = await interpolateVariables(
        msg.messageText,
        msg.userId,
        msg.externalId,
        msg.recipientId
      );

      await sendInstagramMessage(msg.externalId, msg.recipientId, interpolated, igAccount.accessToken);

      // Store message
      await db.insert(dbMessages).values({
        id: crypto.randomUUID(),
        userId: msg.userId,
        externalId: msg.externalId,
        senderId: msg.recipientId,
        automationId: msg.automationId,
        direction: "outbound",
        status: "sent",
        text: interpolated,
        timestamp: new Date(),
      });

      // Mark as sent
      await db
        .update(scheduledMessages)
        .set({
          status: "sent",
          sentAt: new Date(),
          attempts: (msg.attempts ?? 0) + 1,
        })
        .where(eq(scheduledMessages.id, msg.id));

      results.processed++;
    } catch (error) {
      const attempts = (msg.attempts ?? 0) + 1;
      const shouldFail = attempts >= 3;

      await db
        .update(scheduledMessages)
        .set({
          attempts,
          lastError: error instanceof Error ? error.message : "Send failed",
          status: shouldFail ? "failed" : "pending",
          dueAt: shouldFail
            ? msg.dueAt
            : new Date(Date.now() + Math.pow(2, attempts) * 60 * 1000),
        })
        .where(eq(scheduledMessages.id, msg.id));

      if (shouldFail) results.failed++;
    }
  }

  return results;
}

// Process pending queue events (called by cron)
export async function processQueueBatch(limit = 50): Promise<{ processed: number; failed: number }> {
  const now = new Date();

  const pendingEvents = await db.query.eventQueue.findMany({
    where: and(
      eq(eventQueue.status, "pending"),
      lte(eventQueue.scheduledFor, now)
    ),
    orderBy: [asc(eventQueue.scheduledFor)],
    limit,
  });

  const results = { processed: 0, failed: 0 };

  for (const event of pendingEvents) {
    const result = await processQueuedEvent(event.id);
    if (result.success) {
      results.processed++;
    } else {
      results.failed++;
    }
  }

  return results;
}

// Helper: interpolate variables
async function interpolateVariables(
  text: string,
  userId: string,
  externalId: string,
  recipientId: string
): Promise<string> {
  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.userId, userId),
      eq(contacts.externalId, externalId),
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

// Helper: upsert contact
async function upsertContact(userId: string, externalId: string, senderId: string, accessToken: string) {
  const existing = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.userId, userId),
      eq(contacts.externalId, externalId),
      eq(contacts.senderId, senderId)
    ),
  });

  let profile: Awaited<ReturnType<typeof getInstagramUserProfile>> | null = null;
  try {
    profile = await getInstagramUserProfile(senderId, accessToken);
  } catch {
    // Best effort
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
      externalId,
      senderId,
      username: profile?.username ?? null,
      name: profile?.name ?? null,
      profilePic: profile?.profile_pic ?? null,
      isFollower: profile?.is_user_follow_business ?? false,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      status: "automated",
      aiCategory: "unknown",
    });
  }
}

// Helper: track automation metrics
async function trackAutomationMetrics(userId: string, automationId: string) {
  const { automationMetrics } = await import("@/lib/db/schema");

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
}

// Helper: track analytics
async function trackAnalytics(params: {
  userId: string;
  eventType: string;
  automationId?: string;
  externalId?: string;
  recipientId?: string;
  metadata?: unknown;
}) {
  await db.insert(analyticsEvents).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    eventType: params.eventType,
    automationId: params.automationId ?? null,
    externalId: params.externalId ?? null,
    recipientId: params.recipientId ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

// Handle direct DM sends (for manual messages)
async function handleDirectSend(payload: {
  userId: string;
  externalId: string;
  recipientId: string;
  text: string;
  accessToken: string;
}) {
  const { userId, externalId, recipientId, text, accessToken } = payload;

  await sendInstagramMessage(externalId, recipientId, text, accessToken);

  await db.insert(dbMessages).values({
    id: crypto.randomUUID(),
    userId,
    externalId,
    senderId: recipientId,
    direction: "outbound",
    status: "sent",
    text,
    timestamp: new Date(),
  });
}

