import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationToast } from "@/components/notification-toast";
import { SupportPopup } from "@/components/support-popup";
import { DemoNotifications } from "@/components/demo-notifications";
import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { FeedbackButton } from "@/components/feedback-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <DashboardContent>{children}</DashboardContent>
        <NotificationToast />
        <SupportPopup />
        <DemoNotifications />
        <FeedbackButton />
      </div>
    </SidebarProvider>
  );
}
