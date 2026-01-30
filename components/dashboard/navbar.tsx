"use client";

import { ThemeSwitch } from "@/components/theme-switch";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { UserNav } from "@/components/dashboard/user-nav";
import { GlobalSearch } from "@/components/global-search";
import { GlobalTaskMonitor } from "./global-task-monitor";
import { GlobalTerminal } from "./global-terminal";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Mobile Navigation */}
        <MobileNav />

        {/* Global Search - Hidden on very small screens if needed, or just flex-1 */}
        <div className="flex-1 max-w-md hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <GlobalTaskMonitor />
          <GlobalTerminal />
          <ThemeSwitch />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
