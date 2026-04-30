export const dynamic = "force-dynamic";

import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Settings, LogOut, Activity, Bell } from "lucide-react";
import Image from "next/image";
import { count, eq } from "drizzle-orm";

import { ConnectionStatus } from "@/components/dashboard/connection-status";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/db/client";
import { instagramAccounts, notificationLogs } from "@/lib/db/schema";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    <div className="flex h-screen bg-muted/35">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
            <BotLogo />
          </span>
          <span className="text-xl font-semibold">AutoLoop</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
            className="mt-auto border-t px-3 pt-4"
          >
            <button type="submit" className="flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="size-4" /> Sign Out
            </button>
          </form>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-8 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold">Operations</h1>
            <p className="text-xs text-muted-foreground">Shared state, account health, and automation activity</p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <ThemeToggle />
            <span className="text-sm font-medium">{session.user?.name}</span>
            {session.user?.image && (
              <Image unoptimized src={session.user.image} alt="Avatar" width={32} height={32} className="h-8 w-8 rounded-full" />
            )}
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
    </DashboardProvider>
  );
}

function BotLogo() {
  return <Activity className="size-5" />;
}
