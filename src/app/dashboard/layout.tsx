export const dynamic = "force-dynamic";

import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Settings, LogOut, Activity, Bell, BarChart3, PenSquare } from "lucide-react";
import Image from "next/image";
import { count, eq } from "drizzle-orm";

import { ConnectionStatus } from "@/components/dashboard/connection-status";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition } from "@/components/dashboard/page-transition";
import { db } from "@/lib/db/client";
import { instagramAccounts, notificationLogs } from "@/lib/db/schema";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { GlobalSearch } from "@/components/dashboard/global-search";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
  { href: "/dashboard/content", label: "Content", icon: PenSquare },
  { href: "/dashboard/automations", label: "Automations", icon: Activity },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Logs", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id;
  let connections = [{ value: 0 }];
  let latestLog: typeof notificationLogs.$inferSelect | null | undefined = null;

  if (userId) {
    try {
      [connections, latestLog] = await Promise.all([
        db
          .select({ value: count() })
          .from(instagramAccounts)
          .where(eq(instagramAccounts.userId, userId)),
        db.query.notificationLogs.findFirst({
          where: eq(notificationLogs.userId, userId),
          orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        }),
      ]);
    } catch (error) {
      console.error("[DashboardLayout] Failed to load shared dashboard state", error);
    }
  }

  return (
    <DashboardProvider
      value={{
        userName: session.user?.name ?? null,
        connectionCount: connections[0]?.value ?? 0,
        latestNotificationStatus: latestLog?.status ?? null,
      }}
    >
      <div className="flex h-screen bg-muted/35 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background/60 backdrop-blur-xl z-20">
          <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5 glass-card shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
              <BotLogo />
            </span>
            <span className="text-xl font-bold tracking-tight">AutoLoop</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground hover:shadow-md hover:-translate-y-0.5"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="mt-auto border-t border-white/5 pt-4"
            >
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut className="size-4" /> Sign Out
              </button>
            </form>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Header */}
          <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-background/60 px-4 md:px-8 backdrop-blur-xl glass-card">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <MobileNav navItems={navItems} user={session.user ?? null} />
              </div>
              
              <GlobalSearch />

              <div className="md:hidden flex items-center gap-2">
                 <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white shadow-sm">
                   <BotLogo />
                 </span>
                 <span className="text-base font-bold tracking-tight">AutoLoop</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <ConnectionStatus />
              <ThemeToggle />
              <span className="text-sm font-bold hidden sm:block">{session.user?.name}</span>
              {session.user?.image && (
                <Image unoptimized src={session.user.image} alt="Avatar" width={32} height={32} className="h-8 w-8 rounded-full border-2 border-primary/20 shadow-md" />
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/10 bg-background/80 backdrop-blur-2xl pb-safe">
          <div className="flex items-center justify-around p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="size-5" />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </DashboardProvider>
  );
}

function BotLogo() {
  return <Activity className="size-5" />;
}
