import { auth } from "@/lib/auth/config";
import { getNotificationLogs } from "@/lib/notifications/logs";
import { NotificationsContent } from "./notifications-bridge";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const logs = await getNotificationLogs(session.user.id, 50);

  return <NotificationsContent logs={logs} />;
}
