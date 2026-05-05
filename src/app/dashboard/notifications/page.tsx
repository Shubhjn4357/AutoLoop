import { auth } from "@/lib/auth/config";
import { getNotificationLogs } from "@/lib/notifications/logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/components/dashboard/notification-item";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const logs = await getNotificationLogs(session.user.id, 50);

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
