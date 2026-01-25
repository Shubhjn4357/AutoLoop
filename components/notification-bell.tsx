"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNotificationStore, type Notification } from "@/store/notifications";



export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification
  } = useNotificationStore();

  const [animate, setAnimate] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    // Only animate if unread count INCREASED
    if (unreadCount > prevCount.current) {
      // Defer animation trigger to avoid synchronous state update warning
      const timer = setTimeout(() => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1000);
      }, 0);
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:scale-110"
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
              <div className="divide-y relative">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-accent cursor-pointer transition-colors relative group",
                        !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                      )}
                      onClick={() => {
                        markAsRead(notification.id);
                        setSelectedNotification(notification);
                      }}
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
                          <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification?.type === 'error' && <AlertCircle className="text-red-500 h-5 w-5" />}
              {selectedNotification?.type === 'success' && <CheckCircle2 className="text-green-500 h-5 w-5" />}
              {selectedNotification?.type === 'warning' && <AlertTriangle className="text-yellow-500 h-5 w-5" />}
              {selectedNotification?.type === 'info' && <Info className="text-blue-500 h-5 w-5" />}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {formatTimestamp(selectedNotification?.timestamp || new Date())}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {selectedNotification?.message}
            </div>

            {selectedNotification?.link && (
              <Button asChild className="w-full">
                <a href={selectedNotification.link}>
                  {selectedNotification.actionLabel || "View Details"}
                </a>
              </Button>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedNotification) {
                    removeNotification(selectedNotification.id);
                    setSelectedNotification(null);
                  }
                }}
              >
                Delete Notification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
export function sendNotification(notification: {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  autoClose?: boolean;
  duration?: number;
  link?: string;
  actionLabel?: string;
}) {
  useNotificationStore.getState().addNotification(notification);
}
