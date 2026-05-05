"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, Activity, LogOut, User, ChevronRight, Globe
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface MobileNavProps {
  navItems: NavItem[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function MobileNav({ navItems, user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-white/10">
            <Menu className="size-6" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-[300px] p-0 border-r border-white/5 bg-background/95 backdrop-blur-2xl">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/10 to-purple-600/10">
             <div className="flex items-center gap-3 mb-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                  <Activity className="size-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">AutoLoop</h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Instagram SaaS</p>
                </div>
             </div>

             {user && (
               <div className="flex items-center gap-3 glass-card p-3 rounded-2xl border border-white/10">
                  <div className="relative size-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                    {user.image ? (
                      <Image unoptimized src={user.image} alt={user.name ?? "User"} fill className="object-cover" />
                    ) : (
                      <div className="size-full bg-muted flex items-center justify-center"><User className="size-5" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
               </div>
             )}
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1" 
                          : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("size-5", isActive ? "animate-pulse" : "")} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="size-4 opacity-50" />}
                    </Link>
                  }
                />
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl h-12 text-muted-foreground hover:text-foreground hover:bg-white/10"
              render={
                <a href="https://github.com/shubhamjain-com-in" target="_blank" rel="noopener noreferrer">
                  <Globe className="size-5" />
                  <span>Developer Profile</span>
                </a>
              }
            />
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="size-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
