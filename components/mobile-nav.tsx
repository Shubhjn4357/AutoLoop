"use client";

import { useState } from "react";
import { Menu, LogOut, LayoutDashboard, Building2, Workflow, Mail, FileText, CheckSquare, Settings, Share2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BuyCoffeeWidget } from "@/components/buy-coffee-widget";
import { SignOutModal } from "@/components/sign-out-modal";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Businesses", href: "/dashboard/businesses", icon: Building2 },
  { name: "Scraper", href: "/dashboard/scraper", icon: Search },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Templates", href: "/dashboard/templates", icon: Mail },
  { name: "Analytics", href: "/dashboard/analytics", icon: FileText },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Social Suite", href: "/dashboard/social", icon: Share2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b text-left">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoLoop
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-4 bg-background">
            <BuyCoffeeWidget />
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => {
                setIsOpen(false);
                setShowSignOutModal(true);
              }}
            >
              <LogOut className="h-5 w-5 mr-3 shrink-0" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </>
  );
}

