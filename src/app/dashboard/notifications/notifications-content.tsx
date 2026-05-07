"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/components/dashboard/notification-item";

export function NotificationsContent({ logs }: { 
  logs: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    status: string;
    metadata: string | null;
    createdAt: Date;
  }[] 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">System Notifications</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length > 0 ? (
              logs.map((log) => (
                <NotificationItem key={log.id} log={log} />
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic">No recent activity.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
