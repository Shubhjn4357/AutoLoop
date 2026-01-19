"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Load notifications from localStorage
    const saved = localStorage.getItem("autoloop-notifications");
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed.map((n: Notification) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
    }

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
      
      // Trigger badge animation
      setShowBadge(true);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);

      // Save to localStorage
      const updated = [newNotification, ...notifications];
      localStorage.setItem("autoloop-notifications", JSON.stringify(updated.slice(0, 50)));
    };

    window.addEventListener('new-notification' as any, handleNewNotification as any);
    return () => {
      window.removeEventListener('new-notification' as any, handleNewNotification as any);
    };
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("autoloop-notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("autoloop-notifications", JSON.stringify(updated));
    setShowBadge(false);
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("autoloop-notifications");
    setShowBadge(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className={cn(
            "h-5 w-5",
            animate && "animate-bounce"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full",
              animate && "animate-ping"
            )}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-destructive"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full mt-2 shrink-0",
                      notification.type === "success" && "bg-green-500",
                      notification.type === "error" && "bg-red-500",
                      notification.type === "warning" && "bg-yellow-500",
                      notification.type === "info" && "bg-blue-500"
                    )} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Helper function to trigger notifications from anywhere in the app
export function sendNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
  const event = new CustomEvent('new-notification', {
    detail: {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }
  });
  window.dispatchEvent(event);
}
