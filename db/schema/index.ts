import { pgTable, text, timestamp, boolean, integer, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  geminiApiKey: text("gemini_api_key"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  company: text("company"),
  website: text("website"),
  customVariables: jsonb("custom_variables").$type<Record<string, string>>(),
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
});

export const automationWorkflows = pgTable("automation_workflows", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetBusinessType: text("target_business_type").notNull(),
  keywords: jsonb("keywords").notNull().$type<string[]>(),
  isActive: boolean("is_active").default(false).notNull(),
  priority: varchar("priority", { length: 10 }).default("high").notNull(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: jsonb("nodes").notNull().$type<any[]>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: jsonb("edges").notNull().$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).default("info").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => users.id),
});
