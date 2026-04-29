import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Settings, LogOut, Activity } from "lucide-react";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AutoLoop</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/dashboard/automations" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            <Activity className="h-5 w-5" /> Automations
          </Link>
          <Link href="/dashboard/messages" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            <MessageSquare className="h-5 w-5" /> Messages
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            <Settings className="h-5 w-5" /> Settings
          </Link>
          
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 px-3"
          >
            <button type="submit" className="flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          </form>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h1>
          <div className="flex items-center gap-4">
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
  );
}
