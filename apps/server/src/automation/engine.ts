import { 
  db, 
  eq, 
  and, 
  desc, 
  asc, 
  lte,
  automations, 
  socialAccounts, 
  messages as dbMessages, 
  contacts,
  scheduledMessages,
  eventQueue,
  rateLimitState,
  analyticsEvents,
  aiConversations,
  automationMetrics,
  notificationLogs
} from "@autoloop/db";
import { 
  matchesAutomationCondition, 
  sendInstagramMessage, 
  replyToInstagramComment, 
  getInstagramUserProfile,
  likeMediaOrComment
} from "@autoloop/shared";
import { analyzeSentiment, generateSmartReply, trackAnalytics } from "../ai/pipeline";
import { incomingQueue } from "../queue";
import { InternalEvent, TriggerType, Workflow, ActionType } from "@autoloop/types";

// Rate limits per Instagram account
const RATE_LIMITS = {
  dmPerMinute: 15,
  dmPerHour: 150,
  dmPerDay: 500,
};

export const automationEngine = {
  // Process incoming normalized event
  async processEvent(event: InternalEvent) {
    console.log(`[Engine] Processing Event: ${event.triggerType} from ${event.userId}`);
    
    // 1. Log and Queue for auditability
    await this.queueEvent({
      eventType: event.triggerType,
      payload: event,
      externalId: event.accountId,
      recipientId: event.userId,
    });

    return { success: true, queued: 1 };
  },

  // Queue a new event for processing
  async queueEvent(params: {
    eventType: string;
    payload: any;
    externalId: string;
    recipientId: string;
    scheduledFor?: Date;
    idempotencyKey?: string;
  }) {
    const idempotencyKey = params.idempotencyKey || `${params.externalId}-${params.recipientId}-${params.eventType}-${Math.floor(Date.now() / 60000)}`;
    
    // Check for duplicate
    const existing = await db.query.eventQueue.findFirst({
      where: eq(eventQueue.idempotencyKey, idempotencyKey),
    });

    if (existing && existing.status !== "failed") return;

    const id = crypto.randomUUID();
    await db.insert(eventQueue).values({
      id,
      eventType: params.eventType,
      payload: JSON.stringify(params.payload),
      externalId: params.externalId,
      recipientId: params.recipientId,
      scheduledFor: params.scheduledFor || new Date(),
      idempotencyKey,
      status: "pending",
    });

    // Trigger BullMQ job for immediate processing
    await incomingQueue.add('process-queued-event', { eventId: id }, {
      jobId: idempotencyKey, // Use idempotency key as job ID to prevent duplicate jobs
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  },

  // Process a single queued event (called by worker)
  async processQueuedEvent(eventId: string) {
    const event = await db.query.eventQueue.findFirst({
      where: eq(eventQueue.id, eventId),
    });

    if (!event || event.status === "completed") return;

    await db.update(eventQueue).set({ status: "processing", attempts: (event.attempts || 0) + 1 }).where(eq(eventQueue.id, eventId));

    try {
      const eventData: InternalEvent = JSON.parse(event.payload);

      // 1. Condition Engine Logic
      const workflows = await db.query.automations.findMany({
        where: and(
          eq(automations.externalId, event.externalId || ""),
          eq(automations.triggerType, eventData.triggerType),
          eq(automations.isActive, true)
        ),
        orderBy: [desc(automations.priority)],
      });

      console.log(`[Engine] Matching ${workflows.length} workflows for event ${event.id}`);

      for (const workflow of workflows) {
        // Evaluate conditions
        const matches = matchesAutomationCondition(
          workflow.conditionOperator || 'contains', 
          workflow.condition || '', 
          eventData.message || ""
        );

        if (!matches) continue;

        console.log(`[Engine] Workflow triggered: ${workflow.name}`);
        
        // 2. Action System Execution
        await this.handleWorkflowExecution(workflow, eventData);
        
        // Follow prompt: "Execute Actions... Pick randomly... variation engine"
        // For now, we process first matching workflow
        break;
      }

      await db.update(eventQueue).set({ status: "completed", processedAt: new Date() }).where(eq(eventQueue.id, eventId));
    } catch (error: any) {
      console.error(`[Engine] Event processing failed: ${error.message}`);
      const attempts = (event.attempts || 0) + 1;
      const status = attempts >= (event.maxAttempts || 3) ? "failed" : "pending";
      await db.update(eventQueue).set({ 
        status, 
        lastError: error.message,
        scheduledFor: new Date(Date.now() + Math.pow(2, attempts) * 60000)
      }).where(eq(eventQueue.id, eventId));
    }
  },

  // NEW: Modular Workflow Executor
  async handleWorkflowExecution(workflow: any, event: InternalEvent) {
    const account = await db.query.socialAccounts.findFirst({ 
      where: eq(socialAccounts.externalId, event.accountId) 
    });
    if (!account?.accessToken) return;

    // 1. Follower Gate Check (Deterministic Condition)
    if (workflow.requireFollower) {
      const profile = await getInstagramUserProfile(event.userId, account.accessToken).catch(() => null);
      if (profile && !profile.is_user_follow_business) {
         // Execute Follower Gate Action
         await this.executeAction({
           id: 'gate',
           type: ActionType.SEND_DM,
           payload: {
             message: workflow.followerGateTemplate || "Please follow to continue!",
             buttons: [
               { type: 'web_url', url: `https://instagram.com/${account.instagramUsername}`, title: workflow.followerGateButtonText || "Follow Me" },
               { type: 'postback', title: "I'm Following!", payload: `CHECK_FOLLOW_${workflow.id}` }
             ]
           }
         }, account, event.userId);
         return;
      }
    }

    // 2. Map Legacy Fields to Action List
    const actions: any[] = [];

    // Public Comment Reply
    if (event.commentId && workflow.responseTemplate) {
      actions.push({
        id: 'comment-reply',
        type: ActionType.REPLY_COMMENT,
        payload: { message: workflow.responseTemplate, commentId: event.commentId }
      });
    }

    // Main DM
    if (workflow.dmTemplate) {
      actions.push({
        id: 'main-dm',
        type: ActionType.SEND_DM,
        payload: { 
          message: workflow.dmTemplate,
          targetUrl: workflow.targetUrl,
          linkText: workflow.linkText,
          aiEnabled: workflow.aiEnabled,
          aiPrompt: workflow.aiPrompt
        }
      });
    }

    // Follow-ups
    if (workflow.followUpTemplate) {
      actions.push({
        id: 'follow-up-1',
        type: ActionType.SEND_DM,
        delay: workflow.followUpDelayMinutes || 60,
        payload: { message: workflow.followUpTemplate, targetUrl: workflow.followUpUrl, linkText: workflow.followUpUrlText }
      });
    }

    // 3. Execute Actions
    for (const action of actions) {
      if (action.delay && action.delay > 0) {
        await this.scheduleAction(action, workflow.id, account, event.userId);
      } else {
        await this.executeAction(action, account, event.userId, event.message);
      }
    }

    // Track Metrics
    await this.trackAutomationMetrics(workflow.userId, workflow.id);
  },

  async executeAction(action: any, account: any, recipientId: string, triggerText?: string) {
    console.log(`[Action] Executing ${action.type} for ${recipientId}`);
    
    try {
      switch (action.type) {
        case ActionType.SEND_DM:
          await this.executeDMAction(action, account, recipientId, triggerText);
          break;
        case ActionType.REPLY_COMMENT:
          const interpolated = await this.interpolateVariables(action.payload.message, account.userId, account.externalId, recipientId);
          await replyToInstagramComment(action.payload.commentId, interpolated, account.accessToken);
          break;
        // Add more action handlers
      }
    } catch (err: any) {
      console.error(`[Action] Failed: ${err.message}`);
      throw err;
    }
  },

  async executeDMAction(action: any, account: any, recipientId: string, triggerText?: string) {
    let message = action.payload.message;

    // AI Generation if enabled
    if (action.payload.aiEnabled && triggerText) {
       const aiResponse = await generateSmartReply({
         userMessage: triggerText,
         prompt: action.payload.aiPrompt,
       });
       if (aiResponse?.reply) message = aiResponse.reply;
    }

    const interpolated = await this.interpolateVariables(message, account.userId, account.externalId, recipientId);
    
    const buttons = [];
    if (action.payload.targetUrl) {
      buttons.push({ type: 'web_url' as const, url: action.payload.targetUrl, title: action.payload.linkText || "Learn More" });
    }
    if (action.payload.buttons) {
      buttons.push(...action.payload.buttons);
    }

    await sendInstagramMessage((account.pageId || account.externalId)!, recipientId, interpolated, account.accessToken, { buttons });
  },

  async scheduleAction(action: any, workflowId: string, account: any, recipientId: string) {
    console.log(`[Scheduler] Queuing ${action.type} in ${action.delay}m`);
    await this.scheduleFollowUp(
      account.userId,
      workflowId,
      account.externalId,
      recipientId,
      action.payload.message,
      action.delay,
      action.payload.targetUrl,
      action.payload.linkText
    );
  },

  async checkRateLimits(externalId: string, recipientId: string, cooldownMinutes: number) {
    let state = await db.query.rateLimitState.findFirst({ where: eq(rateLimitState.externalId, externalId) });
    if (!state) {
      const id = crypto.randomUUID();
      await db.insert(rateLimitState).values({ id, externalId, lastSendToRecipient: "{}" });
      state = await db.query.rateLimitState.findFirst({ where: eq(rateLimitState.id, id) });
    }
    if (!state) return { allowed: false, retryAfterMs: 0 };

    const lastSendMap = JSON.parse(state.lastSendToRecipient || "{}");
    const lastSend = lastSendMap[recipientId];
    const now = Date.now();
    const cooldownMs = cooldownMinutes * 60000;
    
    if (lastSend && (now - lastSend < cooldownMs)) {
      return { allowed: false, retryAfterMs: cooldownMs - (now - lastSend) };
    }

    lastSendMap[recipientId] = now;
    await db.update(rateLimitState).set({ lastSendToRecipient: JSON.stringify(lastSendMap) }).where(eq(rateLimitState.id, state.id));
    return { allowed: true, retryAfterMs: 0 };
  },

  async interpolateVariables(text: string, userId: string, externalId: string, recipientId: string) {
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.userId, userId), eq(contacts.externalId, externalId), eq(contacts.senderId, recipientId)),
    });
    return text
      .replace(/\{\{\s*first_name\s*\}\}/gi, contact?.name?.split(" ")[0] ?? "there")
      .replace(/\{\{\s*name\s*\}\}/gi, contact?.name ?? "there")
      .replace(/\{\{\s*username\s*\}\}/gi, contact?.username ?? "");
  },

  async upsertContact(userId: string, externalId: string, senderId: string, accessToken: string) {
    const profile = await getInstagramUserProfile(senderId, accessToken).catch(() => null);
    const existing = await db.query.contacts.findFirst({
      where: and(eq(contacts.userId, userId), eq(contacts.externalId, externalId), eq(contacts.senderId, senderId)),
    });

    if (existing) {
      await db.update(contacts).set({
        lastSeenAt: new Date(),
        username: profile?.username || existing.username,
        name: profile?.name || existing.name,
        profilePic: profile?.profile_pic || existing.profilePic,
        isFollower: profile?.is_user_follow_business || existing.isFollower,
      }).where(eq(contacts.id, existing.id));
    } else {
      await db.insert(contacts).values({
        id: crypto.randomUUID(),
        userId,
        externalId,
        senderId,
        username: profile?.username || null,
        name: profile?.name || null,
        profilePic: profile?.profile_pic || null,
        isFollower: profile?.is_user_follow_business || false,
        status: "automated",
      });
    }
  },

  async scheduleFollowUp(
    userId: string, 
    automationId: string, 
    externalId: string, 
    recipientId: string, 
    template: string, 
    delayMinutes: number,
    targetUrl?: string | null,
    linkText?: string | null
  ) {
    await db.insert(scheduledMessages).values({
      id: crypto.randomUUID(),
      userId,
      automationId,
      externalId,
      recipientId,
      messageText: template,
      targetUrl: targetUrl || null,
      linkText: linkText || null,
      status: "pending",
      dueAt: new Date(Date.now() + delayMinutes * 60000),
    });
  },

  async trackAutomationMetrics(userId: string, automationId: string) {
    const existing = await db.query.automationMetrics.findFirst({
      where: and(eq(automationMetrics.userId, userId), eq(automationMetrics.automationId, automationId)),
    });
    if (existing) {
      await db.update(automationMetrics).set({ sendCount: existing.sendCount + 1, lastSentAt: new Date() }).where(eq(automationMetrics.id, existing.id));
    } else {
      await db.insert(automationMetrics).values({ id: crypto.randomUUID(), userId, automationId, sendCount: 1, lastSentAt: new Date() });
    }
  },

  async createNotificationLog(params: any) {
    await db.insert(notificationLogs).values({ id: crypto.randomUUID(), ...params });
  },

  async processScheduledMessage(msgId: string) {
    const msg = await db.query.scheduledMessages.findFirst({ where: eq(scheduledMessages.id, msgId) });
    if (!msg || msg.status !== 'pending') return;

    const account = await db.query.socialAccounts.findFirst({ 
      where: and(eq(socialAccounts.userId, msg.userId), eq(socialAccounts.externalId, msg.externalId)) 
    });

    if (!account?.accessToken) {
      await db.update(scheduledMessages).set({ status: 'failed', lastError: 'Account disconnected' }).where(eq(scheduledMessages.id, msgId));
      return;
    }

    try {
      const interpolated = await this.interpolateVariables(msg.messageText, msg.userId, msg.externalId, msg.recipientId);
      
      // Support buttons in follow-ups from stored data
      const buttons: any[] = [];
      if (msg.targetUrl) {
        const btnText = msg.linkText || "Learn More";
        buttons.push({ type: 'web_url' as const, url: msg.targetUrl, title: btnText });
      } else if (msg.automationId) {
        // Fallback to rule search if not in msg (legacy support)
        const rule = await db.query.automations.findFirst({ where: eq(automations.id, msg.automationId) });
        if (rule) {
          if (msg.messageText === rule.followUpTemplate && rule.followUpUrl) {
            buttons.push({ type: 'web_url' as const, url: rule.followUpUrl, title: rule.followUpUrlText || "Learn More" });
          } else if (msg.messageText === rule.followUp2Template && rule.followUp2Url) {
            buttons.push({ type: 'web_url' as const, url: rule.followUp2Url, title: rule.followUp2UrlText || "Get Details" });
          }
        }
      }

      await sendInstagramMessage((account.pageId || account.externalId)!, msg.recipientId, interpolated, account.accessToken, { buttons });

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

      await db.update(scheduledMessages).set({ status: 'sent', sentAt: new Date() }).where(eq(scheduledMessages.id, msgId));
    } catch (error: any) {
      const attempts = (msg.attempts || 0) + 1;
      await db.update(scheduledMessages).set({ 
        attempts, 
        lastError: error.message,
        status: attempts >= 3 ? 'failed' : 'pending'
      }).where(eq(scheduledMessages.id, msgId));
    }
  }
};
