/**
 * Application-wide Constants
 * Centralized location for all non-changeable text and configuration
 */

// ==================== APPLICATION INFO ====================
export const APP_NAME = "AutoLoop";
export const APP_DESCRIPTION = "Intelligent Business Automation Platform";
export const APP_VERSION = "1.0.0";

// ==================== PAGINATION ====================
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ==================== STATUS VALUES ====================
export const EMAIL_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  OPENED: "opened",
  CLICKED: "clicked",
  BOUNCED: "bounced",
  FAILED: "failed",
} as const;

export const WORKFLOW_STATUSES = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

export const SCRAPING_STATUSES = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

// ==================== SOCIAL MEDIA ====================
export const SOCIAL_PROVIDERS = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  LINKEDIN: "linkedin",
  YOUTUBE: "youtube",
  TWITTER: "twitter",
} as const;

export const SOCIAL_TRIGGER_TYPES = {
  COMMENT_KEYWORD: "comment_keyword",
  DM_KEYWORD: "dm_keyword",
  STORY_MENTION: "story_mention",
  ANY_COMMENT: "any_comment",
} as const;

export const SOCIAL_ACTION_TYPES = {
  REPLY_COMMENT: "reply_comment",
  SEND_DM: "send_dm",
  WHATSAPP_REPLY: "whatsapp_reply",
} as const;

// ==================== WORKFLOW NODES ====================
export const WORKFLOW_NODE_TYPES = {
  TRIGGER: "trigger",
  AI_AGENT: "ai_agent",
  API_REQUEST: "api_request",
  EMAIL: "email",
  CONDITION: "condition",
  DELAY: "delay",
  WEBHOOK: "webhook",
  DATABASE: "database",
  NOTIFICATION: "notification",
} as const;

// ==================== TIME INTERVALS ====================
export const WORKER_CHECK_INTERVAL_MS = 60000; // 1 minute
export const API_RETRY_DELAY_MS = 1000; // 1 second
export const MAX_API_RETRIES = 3;

// ==================== LIMITS ====================
export const MAX_KEYWORDS = 50;
export const MAX_EMAIL_BODY_LENGTH = 50000;
export const MAX_TEMPLATE_NAME_LENGTH = 100;
export const MAX_BUSINESS_NAME_LENGTH = 200;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ==================== UI MESSAGES ====================
export const MESSAGES = {
  // Success messages
  SUCCESS_SAVE: "Changes saved successfully",
  SUCCESS_DELETE: "Deleted successfully",
  SUCCESS_CREATE: "Created successfully",
  SUCCESS_UPDATE: "Updated successfully",
  
  // Error messages
  ERROR_GENERIC: "Something went wrong. Please try again.",
  ERROR_UNAUTHORIZED: "You are not authorized to perform this action",
  ERROR_NOT_FOUND: "Resource not found",
  ERROR_NETWORK: "Network error. Please check your connection.",
  ERROR_VALIDATION: "Please check your input and try again",
  
  // Confirmation messages
  CONFIRM_DELETE: "Are you sure you want to delete this item?",
  CONFIRM_DELETE_PERMANENT: "This action cannot be undone.",
  
  // Loading messages
  LOADING_GENERIC: "Loading...",
  LOADING_SAVING: "Saving...",
  LOADING_DELETING: "Deleting...",
  LOADING_PROCESSING: "Processing...",
} as const;

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  // Business
  BUSINESSES: "/api/businesses",
  BUSINESS_BY_ID: (id: string) => `/api/businesses/${id}`,
  
  // Workflows
  WORKFLOWS: "/api/workflows",
  WORKFLOW_BY_ID: (id: string) => `/api/workflows/${id}`,
  WORKFLOW_TEMPLATES: "/api/workflows/templates",
  WORKFLOW_EXECUTIONS: "/api/workflows/executions",
  
  // Email
  EMAIL_SEND: "/api/email/send",
  EMAIL_TEMPLATES: "/api/email/templates",
  EMAIL_LOGS: "/api/email/logs",
  
  // Scraping
  SCRAPING_START: "/api/scraping/start",
  SCRAPING_CONTROL: "/api/scraping/control",
  SCRAPING_JOBS: "/api/scraping/jobs",
  
  // Social
  SOCIAL_POSTS: "/api/social/posts",
  SOCIAL_AUTOMATIONS: "/api/social/automations",
  SOCIAL_AUTOMATIONS_CREATE: "/api/social/automations/create",
  SOCIAL_AUTOMATIONS_TRIGGER: "/api/social/automations/trigger",
  SOCIAL_CONNECT: "/api/social/connect",
  SOCIAL_WEBHOOKS_FACEBOOK: "/api/social/webhooks/facebook",
  
  // Auth
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNOUT: "/auth/signout",
  
  // Admin
  ADMIN_USERS: "/api/admin/users",
  ADMIN_ANALYTICS: "/api/admin/analytics",
} as const;

// ==================== ROUTES ====================
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  BUSINESSES: "/dashboard/businesses",
  WORKFLOWS: "/dashboard/workflows",
  WORKFLOW_BUILDER: (id: string) => `/dashboard/workflows/builder/${id}`,
  WORKFLOW_EXECUTIONS: "/dashboard/workflows/executions",
  WORKFLOW_TEMPLATES: "/dashboard/workflows/templates",
  EMAIL_DELIVERY: "/dashboard/email/delivery",
  TEMPLATES: "/dashboard/templates",
  SCRAPER: "/dashboard/scraper",
  SOCIAL: "/dashboard/social",
  SOCIAL_POSTS_NEW: "/dashboard/social/posts/new",
  SOCIAL_AUTOMATIONS_NEW: "/dashboard/social/automations/new",
  SETTINGS: "/dashboard/settings",
  TASKS: "/dashboard/tasks",
  SIGNIN: "/auth/signin",
  ADMIN: "/admin",
  FEEDBACK: "/feedback",
} as const;

// ==================== VALIDATION ====================
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  URL_REGEX: /^https?:\/\/.+/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
} as const;

// ==================== COLORS ====================
export const STATUS_COLORS = {
  SUCCESS: "text-green-600 bg-green-50",
  PENDING: "text-yellow-600 bg-yellow-50",
  RUNNING: "text-blue-600 bg-blue-50",
  FAILED: "text-red-600 bg-red-50",
  PAUSED: "text-gray-600 bg-gray-50",
} as const;

// ==================== BADGE VARIANTS ====================
export const BADGE_VARIANTS = {
  [EMAIL_STATUSES.PENDING]: "bg-yellow-100 text-yellow-800",
  [EMAIL_STATUSES.SENT]: "bg-blue-100 text-blue-800",
  [EMAIL_STATUSES.DELIVERED]: "bg-green-100 text-green-800",
  [EMAIL_STATUSES.OPENED]: "bg-purple-100 text-purple-800",
  [EMAIL_STATUSES.CLICKED]: "bg-indigo-100 text-indigo-800",
  [EMAIL_STATUSES.BOUNCED]: "bg-orange-100 text-orange-800",
  [EMAIL_STATUSES.FAILED]: "bg-red-100 text-red-800",
} as const;

// ==================== LOCAL STORAGE KEYS ====================
export const STORAGE_KEYS = {
  THEME: "autoloop-theme",
  SIDEBAR_STATE: "autoloop-sidebar-collapsed",
  USER_PREFERENCES: "autoloop-user-prefs",
  RECENT_SEARCHES: "autoloop-recent-searches",
} as const;

// ==================== FEATURE FLAGS ====================
export const FEATURES = {
  ENABLE_SOCIAL_AUTOMATION: true,
  ENABLE_AI_WORKFLOWS: true,
  ENABLE_SCRAPING: true,
  ENABLE_WHATSAPP: false, // Coming soon
  ENABLE_AB_TESTING: true,
} as const;

// ==================== TYPE EXPORTS ====================
export type EmailStatus = typeof EMAIL_STATUSES[keyof typeof EMAIL_STATUSES];
export type WorkflowStatus = typeof WORKFLOW_STATUSES[keyof typeof WORKFLOW_STATUSES];
export type ScrapingStatus = typeof SCRAPING_STATUSES[keyof typeof SCRAPING_STATUSES];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];
export type SocialProvider = typeof SOCIAL_PROVIDERS[keyof typeof SOCIAL_PROVIDERS];
