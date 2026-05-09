import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
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

  return (
    <DashboardProvider
      initialData={{
        userId: session.user.id,
        userName: session.user.name ?? null,
        userImage: session.user.image ?? null,
        connectionCount: 0,
        latestNotificationStatus: "info",
        recentLogs: [],
      }}
    >
      <LayoutWrapper>{children}</LayoutWrapper>
    </DashboardProvider>
  );
}
