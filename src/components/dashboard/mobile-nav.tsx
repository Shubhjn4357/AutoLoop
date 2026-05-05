"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Sparkles,
  Search,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Search", href: "/dashboard/search", icon: Search },
  { label: "Tools", href: "/dashboard/automations", icon: Bot },
  { label: "Posts", href: "/dashboard/content", icon: Sparkles },
  { label: "Data", href: "/dashboard/insights", icon: BarChart3 },
  { label: "Alerts", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 pointer-events-none">
      <div className="glass-card rounded-2xl flex items-center justify-around p-1 pointer-events-auto shadow-2xl border-white/5">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all relative overflow-hidden",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-all",
                isActive ? "bg-primary/10 shadow-inner" : ""
              )}>
                <Icon className={cn("size-5", isActive ? "scale-110" : "")} />
              </div>
              <span className="text-[10px] font-bold tracking-tight uppercase">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 inset-x-4 h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-top-1 duration-500" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
