"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Bell,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Icon from "@/app/icon1.png";
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Automations", href: "/dashboard/automations", icon: Bot },
  { label: "Content", href: "/dashboard/content", icon: Sparkles },
  { label: "Insights", href: "/dashboard/insights", icon: BarChart3 },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-full border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Image src={Icon} width={24} height={24} className="size-6 rounded-xl " alt="app-icon"/>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground">AutoLoop</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive ? "" : "group-hover:scale-110 transition-transform")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="absolute right-2 size-1.5 rounded-full bg-primary-foreground/50 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-3 rounded-xl justify-start text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors",
            collapsed && "px-2 justify-center"
          )}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-5" />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </Button>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="mt-4 w-full flex items-center justify-start p-2 gap-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          {!collapsed && <span className="font-medium text-sm">Toggle Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
