"use client";

import { NotificationLog } from "@/components/dashboard/notification-log";
import { notificationLogs } from "@/lib/db/schema";

export function NotificationsContent({ logs }: { 
  logs: (typeof notificationLogs.$inferSelect)[] 
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">System Notifications</h2>
        <p className="text-muted-foreground">Monitor and manage your recent automation activities and system alerts.</p>
      </div>
      
      <NotificationLog logs={logs} title="Full Activity History" />
    </div>
  );
}
