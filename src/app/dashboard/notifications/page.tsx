import { redirect } from "next/navigation";

import { NotificationLog } from "@/components/dashboard/notification-log";
import { auth } from "@/lib/auth/config";
import { getNotificationLogs } from "@/lib/notifications/logs";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await getNotificationLogs(session.user.id, 100);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
        <p className="text-muted-foreground">
          Delivery, webhook, condition, and follow-up events from real API activity.
        </p>
      </div>
      <NotificationLog logs={logs} title="Notification Logs" />
    </div>
  );
}

