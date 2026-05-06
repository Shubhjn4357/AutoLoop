"use client";

import { useDashboardContext } from "@/components/dashboard/dashboard-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { cn } from "@/lib/utils";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useDashboardContext();

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex md:flex-col transition-all duration-300 ease-in-out shrink-0",
        isSidebarCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden relative w-full">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8" data-lenis-prevent>
          {children}
        </main>
      </div>
    </div>
  );
}
