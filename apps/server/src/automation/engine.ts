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
  getInstagramUserProfile 
} from "@autoloop/shared";
import { analyzeSentiment, generateSmartReply, trackAnalytics } from "../ai/pipeline";
import { incomingQueue } from "../queue";

// Rate limits per Instagram account
const RATE_LIMITS = {
  dmPerMinute: 15,
  dmPerHour: 150,
  dmPerDay: 500,
};

export const automationEngine = {
  // Process incoming webhook event
  async processEvent(payload: any) {
    if (payload.object !== "instagram" || !payload.entry) return { success: false, queued: 0 };

    let queued = 0;
    for (const entry of payload.entry) {
      const externalId = entry.id;

      // Handle DMs
      if (entry.messaging) {
        for (const msg of entry.messaging) {
          if (msg.message?.is_echo) continue;
          if (!msg.message?.text) continue;

          await this.queueEvent({
            eventType: msg.message.reply_to?.story ? "story_reply" : "dm",
            payload: {
              externalId,
              senderId: msg.sender.id,
              text: msg.message.text,
              quickReplyPayload: msg.message.quick_reply?.payload,
              storyId: msg.message.reply_to?.story?.id,
              timestamp: msg.timestamp,
            },
            externalId,
            recipientId: msg.sender.id,
          });
          queued++;
        }
      }

      // Handle Comments, Mentions, and Follows
      if (entry.changes) {
        for (const change of entry.changes) {
          // Support both 'comments' and 'feed' (Page activity)
          if (change.field === "comments" || change.field === "feed") {
            const val = change.value;
            // Only process if it's a comment and not a reply to another comment
            if (val.item !== "comment" && change.field === "feed") continue;
            if (val.parent_id) continue;

            await this.queueEvent({
              eventType: "comment",
              payload: {
                externalId,
                senderId: val.from.id,
                text: val.text || val.message,
                mediaId: val.media?.id || val.post_id,
                commentId: val.id || val.comment_id,
              },
              externalId,
              recipientId: val.from.id,
            });
            queued++;
          }

          if (change.field === "mentions") {
            const val = change.value;
            await this.queueEvent({
              eventType: "mention",
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
            queued++;
          }

          if (change.field === "follows" && change.value.action === "follow") {
            const val = change.value;
            await this.queueEvent({
              eventType: "follow",
              payload: {
                externalId,
                senderId: val.from.id,
                followerUsername: val.from.username,
              },
              externalId,
              recipientId: val.from.id,
            });
            queued++;
          }
        }
      }
    }
    return { success: true, queued };
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
      const payload = JSON.parse(event.payload);

      switch (event.eventType) {
        case "dm":
        case "story_reply":
          await this.handleDM(payload, event.eventType);
          break;
        case "comment":
          await this.handleComment(payload);
          break;
        case "follow":
          await this.handleFollow(payload);
          break;
        case "mention":
          await this.handleMention(payload);
          break;
        default:
          throw new Error(`Unknown event type: ${event.eventType}`);
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

  async handleDM(payload: any, eventType: string) {
    const { externalId, senderId, text, quickReplyPayload } = payload;
    const account = await db.query.socialAccounts.findFirst({ where: eq(socialAccounts.externalId, externalId) });
    if (!account?.accessToken) return;

    // Handle Follower-Check Quick Reply
    if (quickReplyPayload?.startsWith('CHECK_FOLLOW_')) {
      const automationId = quickReplyPayload.replace('CHECK_FOLLOW_', '');
      const profile = await getInstagramUserProfile(senderId, account.accessToken);
      if (profile.is_user_follow_business) {
        const rule = await db.query.automations.findFirst({ where: eq(automations.id, automationId) });
        if (rule) {
          await sendInstagramMessage((account.pageId || account.externalId)!, senderId, `Awesome! Thanks for following. Here is what I promised:`, account.accessToken);
          await this.executeAutomation(rule, account, senderId, text, crypto.randomUUID());
          return;
        }
      } else {
        await sendInstagramMessage((account.pageId || account.externalId)!, senderId, `Oops! It looks like you aren't following me yet. Please follow and then click again!`, account.accessToken);
        return;
      }
    }

    // 1. Store incoming message
    const messageId = crypto.randomUUID();
    await db.insert(dbMessages).values({
      id: messageId,
      userId: account.userId,
      externalId,
      senderId,
      direction: "inbound",
      status: "received",
      text,
      timestamp: new Date(payload.timestamp || Date.now()),
    });

    // 2. Analyze sentiment (DISABLED for now to save AI quota)
    /*
    const { sentiment } = await analyzeSentiment(text);
    await db.update(dbMessages).set({ sentiment }).where(eq(dbMessages.id, messageId));
    */
    const sentiment = "neutral";

    // 3. Upsert contact
    await this.upsertContact(account.userId, externalId, senderId, account.accessToken);

    // 4. Log notification
    await this.createNotificationLog({
      userId: account.userId,
      type: "message.received",
      title: "Incoming Instagram DM",
      message: `From ${senderId}: "${text.substring(0, 50)}..."`,
      metadata: { externalId, senderId, messageId, sentiment },
    });

    // 5. Execute automations
    const rules = await db.query.automations.findMany({
      where: and(
        eq(automations.userId, account.userId),
        eq(automations.triggerType, eventType),
        eq(automations.isActive, true)
      ),
      orderBy: [desc(automations.priority)],
    });

    for (const rule of rules) {
      if (rule.targetPostId && rule.targetPostId !== payload.storyId) continue;
      if (!matchesAutomationCondition(rule.conditionOperator || 'contains', rule.condition || '', text)) continue;

      console.log(`[Automation] Triggered rule: "${rule.name}" (ID: ${rule.id})`);
      console.log(`[Automation] Data - URL: "${rule.targetUrl}", LinkText: "${rule.linkText}", AI: ${rule.aiEnabled}`);

      // Follower requirement logic
      if (rule.requireFollower) {
        const profile = await getInstagramUserProfile(senderId, account.accessToken);
        if (!profile.is_user_follow_business) {
          // Send "Follow Me" message with custom templates
          const gateMessage = rule.followerGateTemplate || `Hey there! Please follow me first to unlock this automation. Once you follow, click the button below!`;
          const buttonText = rule.followerGateButtonText || `Follow Me`;
          
          await sendInstagramMessage((account.pageId || account.externalId)!, senderId, 
            gateMessage, 
            account.accessToken,
            {
              buttons: [
                { type: 'web_url', url: `https://instagram.com/${account.instagramUsername || 'profile'}`, title: buttonText }
              ],
              quickReplies: [
                { title: "I'm Following!", payload: `CHECK_FOLLOW_${rule.id}` }
              ]
            }
          );
          break; // Stop here until they follow
        }
      }

      // Rate limit check
      const rateCheck = await this.checkRateLimits(externalId, senderId, rule.cooldownMinutes || 5);
      if (!rateCheck.allowed) continue;

      await this.executeAutomation(rule, account, senderId, text, messageId);
      break;
    }
  },

  async handleComment(payload: any) {
    const { externalId, senderId, text, commentId, mediaId } = payload;
    const account = await db.query.socialAccounts.findFirst({ where: eq(socialAccounts.externalId, externalId) });
    if (!account?.accessToken) return;

    const rules = await db.query.automations.findMany({
      where: and(
        eq(automations.userId, account.userId),
        eq(automations.triggerType, "comment"),
        eq(automations.isActive, true)
      ),
      orderBy: [desc(automations.priority)],
    });

    for (const rule of rules) {
      if (rule.targetPostId && rule.targetPostId !== mediaId) continue;
      if (!matchesAutomationCondition(rule.conditionOperator || 'contains', rule.condition || '', text)) continue;

      await this.executeAutomation(rule, account, senderId, text, undefined, commentId);
      break;
    }
  },

  async handleFollow(payload: any) {
    const { externalId, senderId, followerUsername } = payload;
    const account = await db.query.socialAccounts.findFirst({ where: eq(socialAccounts.externalId, externalId) });
    if (!account?.accessToken) return;

    const rules = await db.query.automations.findMany({
      where: and(
        eq(automations.userId, account.userId),
        eq(automations.triggerType, "follow"),
        eq(automations.isActive, true)
      ),
      orderBy: [desc(automations.priority)],
    });

    for (const rule of rules) {
      await this.executeAutomation(rule, account, senderId, `[NEW_FOLLOW] ${followerUsername || senderId}`);
      break;
    }
  },

  async handleMention(payload: any) {
    const { externalId, senderId, text, commentId, mediaId } = payload;
    const account = await db.query.socialAccounts.findFirst({ where: eq(socialAccounts.externalId, externalId) });
    if (!account?.accessToken) return;

    const rules = await db.query.automations.findMany({
      where: and(
        eq(automations.userId, account.userId),
        eq(automations.triggerType, "mention"),
        eq(automations.isActive, true)
      ),
      orderBy: [desc(automations.priority)],
    });

    for (const rule of rules) {
      if (rule.targetPostId && rule.targetPostId !== mediaId) continue;
      if (!matchesAutomationCondition(rule.conditionOperator || 'contains', rule.condition || '', text)) continue;

      await this.executeAutomation(rule, account, senderId, text, undefined, commentId);
      break;
    }
  },

  async executeAutomation(rule: any, account: any, recipientId: string, messageText: string, messageId?: string, commentId?: string) {
    let dmContent = rule.dmTemplate;

    // AI Support
    if (rule.aiEnabled && rule.aiPrompt) {
      const conversation = await db.query.aiConversations.findFirst({
        where: and(eq(aiConversations.externalId, account.externalId), eq(aiConversations.recipientId, recipientId)),
      });

      const aiResponse = await generateSmartReply({
        userMessage: messageText,
        prompt: rule.aiPrompt,
        context: conversation?.context || undefined,
      });

      if (aiResponse?.reply) {
        dmContent = aiResponse.reply;
        // Update context (best effort)
        const newHistory = [...(conversation?.context ? JSON.parse(conversation.context).history : []).slice(-4), { role: "user", content: messageText }, { role: "assistant", content: dmContent }];
        await db.insert(aiConversations).values({
          id: crypto.randomUUID(),
          userId: rule.userId,
          externalId: account.externalId,
          recipientId,
          context: JSON.stringify({ history: newHistory }),
          intent: aiResponse.intent || "unknown",
          lastMessageAt: new Date(),
        }).onConflictDoUpdate({
          target: [aiConversations.externalId, aiConversations.recipientId],
          set: { context: JSON.stringify({ history: newHistory }), intent: aiResponse.intent || "unknown", lastMessageAt: new Date() }
        });
      }
    }

    const interpolatedDM = await this.interpolateVariables(dmContent, rule.userId, account.externalId, recipientId);
    
    // Send Public Comment Reply
    if (commentId && rule.responseTemplate) {
      const interpolatedReply = await this.interpolateVariables(rule.responseTemplate, rule.userId, account.externalId, recipientId);
      await replyToInstagramComment(commentId, interpolatedReply, account.accessToken);
    }

    // Send Main DM with Button support
    if (interpolatedDM.trim()) {
      const buttons: any[] = [];
      const targetUrl = rule.targetUrl;
      const linkText = rule.linkText || (targetUrl ? "Visit Website" : null);

      if (targetUrl && linkText) {
        console.log(`[Automation] Attaching button to DM: "${linkText}" -> ${targetUrl}`);
        buttons.push({ type: 'web_url' as const, url: targetUrl, title: linkText });
      }

      await sendInstagramMessage((account.pageId || account.externalId)!, recipientId, interpolatedDM, account.accessToken, { buttons });
      
      await db.insert(dbMessages).values({
        id: crypto.randomUUID(),
        userId: rule.userId,
        externalId: account.externalId,
        senderId: recipientId,
        automationId: rule.id,
        direction: "outbound",
        status: "sent",
        text: interpolatedDM,
        timestamp: new Date(),
      });
    }

    // Handle Sequential / Immediate Follow-up
    if (rule.followUpTemplate && (rule.followUpDelayMinutes || 0) === 0) {
      const interpolatedFollowUp = await this.interpolateVariables(rule.followUpTemplate, rule.userId, account.externalId, recipientId);
      const fuButtons: any[] = [];
      const fuUrl = rule.followUpUrl;
      const fuText = rule.followUpUrlText || (fuUrl ? "Learn More" : null);

      if (fuUrl && fuText) {
        fuButtons.push({ type: 'web_url' as const, url: fuUrl, title: fuText });
      }
      await sendInstagramMessage((account.pageId || account.externalId)!, recipientId, interpolatedFollowUp, account.accessToken, { buttons: fuButtons });
    } else if (rule.followUpTemplate) {
      await this.scheduleFollowUp(rule.userId, rule.id, account.externalId, recipientId, rule.followUpTemplate, rule.followUpDelayMinutes || 60);
    }

    if (rule.followUp2Template) {
      await this.scheduleFollowUp(rule.userId, rule.id, account.externalId, recipientId, rule.followUp2Template, rule.followUp2DelayMinutes || 1440);
    }

    // Track Metrics & Analytics
    await this.trackAutomationMetrics(rule.userId, rule.id);
    await trackAnalytics({ userId: rule.userId, eventType: "automation_triggered", automationId: rule.id, externalId: account.externalId, recipientId });
  },

  async checkRateLimits(externalId: string, recipientId: string, cooldownMinutes: number) {
    let state = await db.query.rateLimitState.findFirst({ where: eq(rateLimitState.externalId, externalId) });
    if (!state) {
      const id = crypto.randomUUID();
      await db.insert(rateLimitState).values({ id, externalId, lastSendToRecipient: "{}" });
      state = await db.query.rateLimitState.findFirst({ where: eq(rateLimitState.id, id) });
    }
    if (!state) return { allowed: false };

    const lastSendMap = JSON.parse(state.lastSendToRecipient || "{}");
    const lastSend = lastSendMap[recipientId];
    if (lastSend && (Date.now() - lastSend < cooldownMinutes * 60000)) {
      return { allowed: false };
    }

    lastSendMap[recipientId] = Date.now();
    await db.update(rateLimitState).set({ lastSendToRecipient: JSON.stringify(lastSendMap) }).where(eq(rateLimitState.id, state.id));
    return { allowed: true };
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

  async scheduleFollowUp(userId: string, automationId: string, externalId: string, recipientId: string, template: string, delayMinutes: number) {
    await db.insert(scheduledMessages).values({
      id: crypto.randomUUID(),
      userId,
      automationId,
      externalId,
      recipientId,
      messageText: template,
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
      
      // Support buttons in follow-ups
      const buttons: any[] = [];
      if (msg.automationId) {
        const rule = await db.query.automations.findFirst({ where: eq(automations.id, msg.automationId) });
        if (rule) {
          // If this text matches follow-up 1 or 2, use their respective buttons
          if (msg.messageText === rule.followUpTemplate && rule.followUpUrl) {
            const fuText = rule.followUpUrlText || "Learn More";
            buttons.push({ type: 'web_url' as const, url: rule.followUpUrl, title: fuText });
          } else if (msg.messageText === rule.followUp2Template && rule.followUp2Url) {
            const fu2Text = rule.followUp2UrlText || "Get Details";
            buttons.push({ type: 'web_url' as const, url: rule.followUp2Url, title: fu2Text });
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
