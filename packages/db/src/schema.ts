import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  webhookToken: text("webhook_token"),
  settingsJson: text("settings_json"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  subscriptionStatus: text("subscription_status"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const socialAccounts = sqliteTable("social_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull().default("instagram"),
  externalId: text("external_id"), // was externalId
  pageId: text("page_id"),
  accessToken: text("access_token"),
  connectedAt: integer("connected_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const automations = sqliteTable("automations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),

  // Trigger configuration
  triggerType: text("trigger_type").notNull().default("dm"), // dm, comment, story_reply, mention, follow
  conditionOperator: text("condition_operator").notNull().default("contains"), // any, contains, equals, starts_with, ends_with, regex
  condition: text("condition"), // keyword or pattern to match
  targetPostId: text("target_post_id"), // optional: specific post/story to trigger on

  // Response configuration
  responseTemplate: text("response_template"), // public comment reply (for comment triggers)
  dmTemplate: text("dm_template").notNull(), // primary DM response
  targetUrl: text("target_url"), // optional link to include

  // Follow-up sequence (simplified - up to 3 follow-ups)
  followUpTemplate: text("follow_up_template"),
  followUpDelayMinutes: integer("follow_up_delay_minutes").default(60),
  followUp2Template: text("follow_up_2_template"),
  followUp2DelayMinutes: integer("follow_up_2_delay_minutes").default(1440), // 24 hours

  // Smart features
  requireFollower: integer("require_follower", { mode: "boolean" }).default(false),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).default(false), // use AI for smart replies
  aiPrompt: text("ai_prompt"), // custom AI prompt

  // Rate limiting
  cooldownMinutes: integer("cooldown_minutes").default(5), // prevent spam
  maxDailySends: integer("max_daily_sends").default(100), // daily limit

  // Status
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  priority: integer("priority").default(0), // higher = processed first

  // Metadata
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  externalId: text("ig_user_id").notNull(),
  senderId: text("sender_id").notNull(),
  automationId: text("automation_id").references(() => automations.id, { onDelete: "set null" }),
  direction: text("direction").notNull().default("inbound"),
  status: text("status").notNull().default("received"),
  text: text("text").notNull(),
  sentiment: text("sentiment"),
  aiReply: text("ai_reply"),
  platform: text("platform").notNull().default("instagram"),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull(),
});

export const notificationLogs = sqliteTable("notification_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("info"),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const scheduledMessages = sqliteTable("scheduled_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  automationId: text("automation_id").references(() => automations.id, { onDelete: "set null" }),
  externalId: text("ig_user_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  messageText: text("message_text").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
});

export const automationState = sqliteTable("automation_state", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: text("ig_user_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  automationId: text("automation_id").notNull().references(() => automations.id, { onDelete: "cascade" }),
  currentNodeId: text("current_node_id").notNull(),
  metadataJson: text("metadata_json"),
  lastInteractionAt: integer("last_interaction_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: text("ig_user_id").notNull(),
  senderId: text("sender_id").notNull(),
  username: text("username"),
  name: text("name"),
  profilePic: text("profile_pic"),
  isFollower: integer("is_follower", { mode: "boolean" }).default(false),
  firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  notes: text("notes"),
  status: text("status").notNull().default("automated"),
  aiCategory: text("ai_category"),
  platform: text("platform").notNull().default("instagram"),
});

export const automationMetrics = sqliteTable("automation_metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  automationId: text("automation_id").notNull().references(() => automations.id, { onDelete: "cascade" }),
  sendCount: integer("send_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }),
  lastReplyAt: integer("last_reply_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const contactTags = sqliteTable("contact_tags", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// Event queue for distributed processing
export const eventQueue = sqliteTable("event_queue", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(), // webhook, dm_send, retry
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed

  // Event data
  payload: text("payload").notNull(), // JSON event data
  externalId: text("external_id"), // Instagram account ID
  recipientId: text("recipient_id"), // User who triggered event

  // Processing metadata
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastError: text("last_error"),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }), // for delayed processing

  // Idempotency
  idempotencyKey: text("idempotency_key").unique(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// Rate limiting per Instagram account
export const rateLimitState = sqliteTable("rate_limit_state", {
  id: text("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // Instagram account ID

  // DM rate limiting
  dmCountMinute: integer("dm_count_minute").default(0),
  dmCountHour: integer("dm_count_hour").default(0),
  dmCountDay: integer("dm_count_day").default(0),
  dmWindowStart: integer("dm_window_start", { mode: "timestamp_ms" }),

  // Cooldown tracking per recipient
  lastSendToRecipient: text("last_send_to_recipient"), // JSON: { recipientId: timestamp }

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// Enhanced analytics events
export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // dm_sent, dm_received, automation_triggered, etc.

  // Event details
  automationId: text("automation_id").references(() => automations.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  recipientId: text("recipient_id"),
  metadata: text("metadata"), // JSON additional data

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// AI conversation memory
export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  recipientId: text("recipient_id").notNull(),

  // Conversation context
  context: text("context"), // JSON conversation history
  intent: text("intent"), // detected intent
  lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});
