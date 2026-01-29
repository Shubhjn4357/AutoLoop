// Common TypeScript type definitions for the application

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: "user" | "admin";
  accessToken?: string;
}

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  customVariables?: Record<string, string>;
  linkedinSessionCookie?: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  category: string;
  rating: number | null;
  totalReviews?: number | null;
  source?: string;
  emailStatus: string | null;
  lastContactedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Optional extended fields
  description?: string | null;
  logo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reviewCount?: number | null;
  emailSent?: boolean;
  emailSentAt?: Date | null;
}

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationWorkflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetBusinessType: string;
  keywords: string[];
  isActive: boolean;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  lastRunAt?: Date | null;
  executionCount: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  businessId: string;
  templateId: string | null;
  workflowId: string | null;
  status: "pending" | "sent" | "opened" | "clicked" | "bounced" | "failed";
  error: string | null;
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapingJob {
  id: string;
  userId: string;
  workflowId: string | null;
  keywords: string[];
  status: "pending" | "running" | "completed" | "failed";
  businessesFound: number | null;
  error: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "processing" | "paused" | "failed" | "running";
  priority: "low" | "medium" | "high";
  type?: "scraping" | "workflow";
  businessesFound?: number;
  workflowName?: string;
  createdAt: Date;
}

export interface WorkflowExecutionContext {
  businessId: string;
  businessData: Business;
  variables: Record<string, unknown>;
  userId: string;
  workflowId: string;
}
