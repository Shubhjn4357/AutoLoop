import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SupportPopup } from "@/components/support-popup";
import { DemoNotifications } from "@/components/demo-notifications";
import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { FeedbackButton } from "@/components/feedback-button";
import { InfoBanner } from "@/components/info-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch active banner
  const { db } = await import("@/db");
  const { banners } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const activeBanner = await db.query.banners.findFirst({
    where: eq(banners.isActive, true),
    orderBy: (banners, { desc }) => [desc(banners.createdAt)],
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden flex-col">
        {activeBanner && <InfoBanner message={activeBanner.message} id={activeBanner.id} />}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <DashboardContent>{children}</DashboardContent>
          <SupportPopup />
          <DemoNotifications />
          <FeedbackButton />
        </div>
      </div>
    </SidebarProvider>
  );
}
