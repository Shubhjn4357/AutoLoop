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
  triggerType: text("trigger_type").notNull().default("keyword"),
  conditionOperator: text("condition_operator").notNull().default("contains"),
  condition: text("condition"),
  responseTemplate: text("response_template").notNull(),
  dmTemplate: text("dm_template"),
  targetUrl: text("target_url"),
  followUpTemplate: text("follow_up_template"),
  followUpDelayMinutes: integer("follow_up_delay_minutes").default(0),
  requireFollower: integer("require_follower", { mode: "boolean" }).default(false),
  flowJson: text("flow_json"),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
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
