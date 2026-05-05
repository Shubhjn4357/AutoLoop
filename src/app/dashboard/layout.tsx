import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { TopBar } from "@/components/dashboard/top-bar";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { getDashboardData } from "@/lib/dashboard/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <DashboardProvider
      value={{
        userName: session.user.name ?? null,
        connectionCount: dashboardData.connectionCount,
        latestNotificationStatus: dashboardData.recentLogs[0]?.status || "info",
      }}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </main>
          
          {/* Mobile Bottom Nav */}
          <MobileNav />
        </div>
      </div>
    </DashboardProvider>
  );
}
