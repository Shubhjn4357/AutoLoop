"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDashboard } from "@/hooks/useDashboard";
import { ThemeToggle } from "./theme-toggle";
import { formatDistanceToNowSimple } from "@/lib/date-utils";
import dynamic from "next/dynamic";

const GlobalSearch = dynamic(() => import("./global-search").then(mod => mod.GlobalSearch), { ssr: false });
const Sidebar = dynamic(() => import("./sidebar").then(mod => mod.Sidebar), { ssr: false });

export function TopBar() {
  const { userName, hasIssues, recentLogs } = useDashboard();
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger 
              render={
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 w-64 border-r border-border bg-card">
              <Sidebar className="border-none" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
        
      <div className="flex items-center gap-4">
        {/* Embedded Discovery Drawer */}
        <GlobalSearch />
        <ThemeToggle />
        
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {hasIssues && (
              <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h3 className="font-bold text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => { router.push("/dashboard/notifications"); setShowNotifications(false); }}
                      className="w-full text-left p-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                    >
                      <p className="text-xs font-semibold">{log.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{log.message}</p>
                      <p className="text-[9px] text-primary/60 mt-1">
                        {formatDistanceToNowSimple(new Date(log.createdAt))}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground italic">
                    No recent activity.
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full h-10 text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary rounded-none border-t border-border/30"
                onClick={() => { router.push("/dashboard/notifications"); setShowNotifications(false); }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-none">{userName || "User"}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">AutoLoop</p>
          </div>
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

    
    </header>
  );
}
