"use client";

import { ThemeSwitch } from "@/components/theme-switch";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { UserNav } from "@/components/dashboard/user-nav";
import { GlobalSearch } from "@/components/global-search";

export function Navbar() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileNav />
      <div className="flex flex-1 items-center gap-4">
        <div className="w-full max-w-md">
          <GlobalSearch />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeSwitch />
        <UserNav />
      </div>
    </header>
  );
}
