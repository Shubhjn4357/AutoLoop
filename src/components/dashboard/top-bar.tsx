"use client";

import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";

export function TopBar() {
  const { userName } = useDashboard();

  return (
    <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search automations..." 
            className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-background" />
        </Button>
        
        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-none">{userName || "User"}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">Pro Plan</p>
          </div>
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <User className="size-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
