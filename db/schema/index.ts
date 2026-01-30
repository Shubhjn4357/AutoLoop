import { pgTable, text, timestamp, boolean, integer, jsonb, real, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { WorkflowNode, WorkflowEdge } from "@/types/social-workflow";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: text("role").default("user").notNull(),
  geminiApiKey: text("gemini_api_key"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  company: text("company"),
  website: text("website"),
  customVariables: jsonb("custom_variables").$type<Record<string, string>>(),
  linkedinSessionCookie: text("linkedin_session_cookie"), // "li_at" cookie value
  // WhatsApp Business API Configuration
  whatsappBusinessPhone: text("whatsapp_business_phone"), // WhatsApp Business Phone Number ID
  whatsappAccessToken: text("whatsapp_access_token"), // WhatsApp Business API Access Token
  whatsappVerifyToken: text("whatsapp_verify_token"), // Webhook verification token
});

export const businesses = pgTable("businesses", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  category: text("category").notNull(),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  emailStatus: varchar("email_status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("businesses_user_idx").on(table.userId),
    emailIdx: index("businesses_email_idx").on(table.email),
    emailStatusIdx: index("businesses_email_status_idx").on(table.emailStatus),
    createdAtIdx: index("businesses_created_at_idx").on(table.createdAt),
    userStatusIdx: index("businesses_user_status_idx").on(table.userId, table.emailStatus),
  };
});

export const emailTemplates = pgTable("email_templates", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("email_templates_user_idx").on(table.userId),
    isDefaultIdx: index("email_templates_default_idx").on(table.isDefault),
  };
});

export const automationWorkflows = pgTable("automation_workflows", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  targetBusinessType: text("target_business_type").notNull(),
  keywords: jsonb("keywords").notNull().$type<string[]>(),
  isActive: boolean("is_active").default(false).notNull(),
  priority: varchar("priority", { length: 10 }).default("high").notNull(),
  nodes: jsonb("nodes").notNull().$type<WorkflowNode[]>(),
  edges: jsonb("edges").notNull().$type<WorkflowEdge[]>(),
  lastRunAt: timestamp("last_run_at"),
  executionCount: integer("execution_count").default(0).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("workflow_user_id_idx").on(table.userId),
    isActiveIdx: index("workflow_is_active_idx").on(table.isActive),
  };
});

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  templateId: text("template_id").notNull().references(() => emailTemplates.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    businessIdIdx: index("email_logs_business_idx").on(table.businessId),
    statusIdx: index("email_logs_status_idx").on(table.status),
    sentAtIdx: index("email_logs_sent_at_idx").on(table.sentAt),
    businessStatusIdx: index("email_logs_business_status_idx").on(table.businessId, table.status),
  };
});

export const scrapingJobs = pgTable("scraping_jobs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id").references(() => automationWorkflows.id, { onDelete: "cascade" }),
  keywords: jsonb("keywords").notNull().$type<string[]>(),
  status: varchar("status", { length: 20 }).notNull(),
  priority: varchar("priority", { length: 10 }).default("medium").notNull(),
  businessesFound: integer("businesses_found").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  subject: text("subject"),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).default("general").notNull(),
  status: varchar("status", { length: 20 }).default("new").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const workflowExecutionLogs = pgTable("workflow_execution_logs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull().references(() => automationWorkflows.id, { onDelete: "cascade" }),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull(), // "pending", "running", "success", "failed"
  logs: text("logs"), // JSON stringified array of log entries
  state: jsonb("state"), // Workflow variable state
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => {
  return {
    execWorkflowIdIdx: index("exec_workflow_id_idx").on(table.workflowId),
    execStartedAtIdx: index("exec_started_at_idx").on(table.startedAt),
  };
});

export const workflowTriggers = pgTable("workflow_triggers", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull().references(() => automationWorkflows.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // "new_business", "schedule", "delay_completion"

  // Configuration for different trigger types
  config: jsonb("config").$type<{
    // For schedule triggers
    cronExpression?: string;
    timezone?: string;

    // For new_business triggers
    targetBusinessTypes?: string[];
    minRating?: number;

    // For delay_completion triggers
    delayHours?: number;
  }>(),

  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowTriggerExecutions = pgTable("workflow_trigger_executions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  triggerId: text("trigger_id").notNull().references(() => workflowTriggers.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id").notNull().references(() => automationWorkflows.id, { onDelete: "cascade" }),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull(), // "pending", "running", "success", "failed"
  error: text("error"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    execTriggerIdIdx: index("exec_trigger_id_idx").on(table.triggerId),
    triggerExecWorkflowIdIdx: index("trigger_exec_workflow_id_idx").on(table.workflowId),
  };
});

export const connectedAccounts = pgTable("connected_accounts", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // "facebook", "instagram"
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  name: text("name"),
  picture: text("picture"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectedAccountId: text("connected_account_id").references(() => connectedAccounts.id, { onDelete: "set null" }),
  content: text("content"),
  title: text("title"),
  thumbnailUrl: text("thumbnail_url"),
  tags: jsonb("tags").$type<string[]>(),
  category: text("category"),
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  scheduledAt: timestamp("scheduled_at"),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft', 'scheduled', 'published', 'failed'
  platform: varchar("platform", { length: 20 }).notNull(), // 'facebook', 'instagram', 'both'
  publishedAt: timestamp("published_at"),
  platformPostId: text("platform_post_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialAutomations = pgTable("social_automations", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectedAccountId: text("connected_account_id").references(() => connectedAccounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // 'comment_keyword', 'dm_keyword', 'story_mention', 'any_comment'
  keywords: jsonb("keywords").$type<string[]>(),
  actionType: varchar("action_type", { length: 50 }).notNull(), // 'reply_comment', 'send_dm', 'whatsapp_reply'
  responseTemplate: text("response_template"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  wamid: text("wamid").unique(), // WhatsApp Message ID
  phoneNumber: text("phone_number").notNull(),
  direction: varchar("direction", { length: 10 }).notNull(), // 'inbound', 'outbound'
  type: varchar("type", { length: 20 }).default("text"), // 'text', 'template'
  status: varchar("status", { length: 20 }).default("sent"), // 'sent', 'delivered', 'read', 'failed'
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowExecutionLogsRelations = relations(workflowExecutionLogs, ({ one }) => ({
  workflow: one(automationWorkflows, {
    fields: [workflowExecutionLogs.workflowId],
    references: [automationWorkflows.id],
  }),
  business: one(businesses, {
    fields: [workflowExecutionLogs.businessId],
    references: [businesses.id],
  }),
}));

export const socialAutomationsRelations = relations(socialAutomations, ({ one }) => ({
  user: one(users, {
    fields: [socialAutomations.userId],
    references: [users.id],
  }),
  account: one(connectedAccounts, {
    fields: [socialAutomations.connectedAccountId],
    references: [connectedAccounts.id],
  }),
}));

export const connectedAccountsRelations = relations(connectedAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [connectedAccounts.userId],
    references: [users.id],
  }),
  automations: many(socialAutomations),
}));

// Notifications System
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 20 }).notNull(), // 'workflow', 'social', 'email', 'system', 'task'
  level: varchar("level", { length: 10 }).notNull(), // 'info', 'success', 'warning', 'error'
  read: boolean("read").default(false).notNull(),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 20 }).notNull(), // same categories as notifications
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  desktopEnabled: boolean("desktop_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  featureFlags: jsonb("feature_flags").default({
    betaFeatures: false,
    registration: true,
    maintenance: false,
  }).notNull(),
  emailConfig: jsonb("email_config").default({
    dailyLimit: 10000,
    userRateLimit: 50,
  }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

