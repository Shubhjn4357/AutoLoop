/**
 * Central Export for all Server Actions
 * Import from here for better organization
 */

// Workflow actions
export {
  getWorkflowExecutions,
  getWorkflowStats,
  getRecentTriggerExecutions,
  getWorkflowPerformance,
} from "./workflow";

// Email actions
export {
  getEmailStats,
  getEmailMetricsHistory,
} from "./email";

// Business actions
export {
  getBusinesses,
  getBusinessById,
  updateBusinessStatus,
  deleteBusiness,
  getBusinessStats,
} from "./business";

// Social media actions
export {
  getSocialAutomations,
  getConnectedAccounts,
  getSocialPosts,
  toggleAutomation,
  deleteAutomation,
  getSocialStats,
} from "./social";

// Scraping actions
export {
  getScrapingJobs,
  getScrapingJobById,
  getScrapingStats,
  cancelScrapingJob,
  deleteScrapingJob,
  getRecentScrapingActivity,
} from "./scraping";
