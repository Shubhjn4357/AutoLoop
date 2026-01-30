/**
 * Input Validation Schemas using Zod
 * Centralized validation for API inputs and forms
 */

import { z } from "zod";

// ==================== BUSINESS ====================

export const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

// ==================== WORKFLOW ====================

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(100),
  description: z.string().optional(),
  nodes: z.array(z.any()), // Will be typed more specifically
  edges: z.array(z.any()),
  isActive: z.boolean().default(true),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

// ==================== EMAIL ====================

export const sendEmailSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Email body is required").max(50000),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Email body is required").max(50000),
  variables: z.array(z.string()).optional(),
});

// ==================== SCRAPING ====================

export const startScrapingSchema = z.object({
  keywords: z.array(z.string()).min(1, "At least one keyword is required").max(50),
  maxResults: z.number().int().min(1).max(500).default(50),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  sources: z.array(z.string()).optional(),
});

export const controlScrapingSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  action: z.enum(["pause", "resume", "stop", "set-priority"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

// ==================== SOCIAL ====================

export const createSocialAutomationSchema = z.object({
  name: z.string().min(1, "Automation name is required").max(100),
  connectedAccountId: z.string().min(1, "Connected account is required"),
  triggerType: z.enum(["comment_keyword", "dm_keyword", "story_mention", "any_comment"]),
  keywords: z.array(z.string()).optional(),
  actionType: z.enum(["reply_comment", "send_dm", "whatsapp_reply"]),
  responseTemplate: z.string().min(1, "Response template is required").max(1000),
  isActive: z.boolean().default(true),
});

export const createSocialPostSchema = z.object({
  content: z.string().min(1, "Post content is required").max(5000),
  platforms: z.array(z.enum(["facebook", "instagram", "linkedin", "twitter", "youtube"])).min(1),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  scheduledFor: z.date().optional(),
});

// ==================== AUTH ====================

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().min(1, "Name is required").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ==================== SETTINGS ====================

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ==================== TYPE EXPORTS ====================

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type StartScrapingInput = z.infer<typeof startScrapingSchema>;
export type ControlScrapingInput = z.infer<typeof controlScrapingSchema>;
export type CreateSocialAutomationInput = z.infer<typeof createSocialAutomationSchema>;
export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
