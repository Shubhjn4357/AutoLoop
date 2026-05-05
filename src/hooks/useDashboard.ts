/**
 * Convenience hook for accessing global dashboard state
 */

import { useDashboardContext } from "@/components/dashboard/dashboard-context";

export function useDashboard() {
  const context = useDashboardContext();
  
  return {
    ...context,
    isConnected: context.connectionCount > 0,
    hasIssues: context.latestNotificationStatus === "error" || context.latestNotificationStatus === "warning"
  };
}
