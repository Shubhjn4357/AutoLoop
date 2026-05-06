import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { getDashboardData } from "@/lib/dashboard/data";
import LayoutWrapper from "./layout-wrapper";

import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <DashboardProvider
      initialData={{
        userName: session.user.name ?? null,
        connectionCount: dashboardData.connectionCount,
        latestNotificationStatus: dashboardData.recentLogs[0]?.status || "info",
        recentLogs: dashboardData.recentLogs,
      }}
    >
      <LayoutWrapper>{children}</LayoutWrapper>
    </DashboardProvider>
  );
}
