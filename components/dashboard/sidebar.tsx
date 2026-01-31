"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Mail,
  Workflow,
  Settings,
  LogOut,
  ChevronLeft,
  FileText,
  CheckSquare,
  Share2,
  Search,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BuyCoffeeWidget } from "@/components/buy-coffee-widget";
import { SignOutModal } from "@/components/sign-out-modal";
import { useSidebar } from "./sidebar-provider";


const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Businesses", href: "/dashboard/businesses", icon: Building2 },
  { name: "Scraper", href: "/dashboard/scraper", icon: Search },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Templates", href: "/dashboard/templates", icon: Mail },
  { name: "Analytics", href: "/dashboard/analytics", icon: FileText },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Social Suite", href: "/dashboard/social", icon: Share2 },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  return (
    <>
      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 relative border-r bg-background/95 backdrop-blur-xl transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoLoop
              </span>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
          )}
        </div>
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent cursor-pointer",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Buy Coffee Widget */}
        {!isCollapsed && <BuyCoffeeWidget />}

        {/* Logout */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={cn(" hover:text-destructive-foreground hover:bg-destructive w-full cursor-pointer", isCollapsed ? "justify-center p-2" : "justify-start")}
            onClick={() => setShowSignOutModal(true)}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          className="absolute z-999 -right-3 top-9 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md cursor-pointer hover:bg-accent"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </>
  );
}
