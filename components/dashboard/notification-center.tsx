"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NotificationCategory = "workflow" | "social" | "email" | "system" | "task";
type NotificationLevel = "info" | "success" | "warning" | "error";

interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    level: NotificationLevel;
    read: boolean;
    actionUrl?: string | null;
    createdAt: Date | string;
}

const levelColors = {
    info: {
        bg: "bg-blue-50 dark:bg-blue-950",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-900 dark:text-blue-100",
        icon: "text-blue-600",
    },
    success: {
        bg: "bg-green-50 dark:bg-green-950",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-900 dark:text-green-100",
        icon: "text-green-600",
    },
    warning: {
        bg: "bg-amber-50 dark:bg-amber-950",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-900 dark:text-amber-100",
        icon: "text-amber-600",
    },
    error: {
        bg: "bg-red-50 dark:bg-red-950",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-900 dark:text-red-100",
        icon: "text-red-600",
    },
};

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [category, setCategory] = useState<NotificationCategory | "all">("all");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchNotifications = async (cat?: NotificationCategory) => {
        try {
            setLoading(true);
            const url = cat ? `/api/notifications?category=${cat}` : "/api/notifications";
            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications(category === "all" ? undefined : category);
        }
    }, [open, category]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetch("/api/notifications")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setUnreadCount(data.data.unreadCount);
                    }
                });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}`, {
                method: "PATCH",
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            const res = await fetch(`/api/notifications/${notificationId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                toast({
                    title: "Success",
                    description: "Notification deleted",
                });
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await fetch("/api/notifications/actions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "mark-all-read",
                    category: category === "all" ? undefined : category,
                }),
            });

            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
                toast({
                    title: "Success",
                    description: "All notifications marked as read",
                });
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleDeleteAllRead = async () => {
        try {
            const res = await fetch("/api/notifications/actions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete-all-read" }),
            });

            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => !n.read));
                toast({
                    title: "Success",
                    description: "All read notifications deleted",
                });
            }
        } catch (error) {
            console.error("Error deleting read notifications:", error);
        }
    };

    const filteredNotifications =
        category === "all"
            ? notifications
            : notifications.filter((n) => n.category === category);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[420px] p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                        >
                            <CheckCheck className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteAllRead}
                            title="Delete all read"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Tabs value={category} onValueChange={(v) => setCategory(v as NotificationCategory | "all")}>
                    <div className="overflow-x-auto w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 min-w-max">
                            <TabsTrigger
                                value="all"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                value="workflow"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Workflow
                            </TabsTrigger>
                            <TabsTrigger
                                value="social"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Social
                            </TabsTrigger>
                            <TabsTrigger
                                value="email"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Email
                            </TabsTrigger>
                            <TabsTrigger
                                value="system"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                System
                            </TabsTrigger>
                        </TabsList>
                </div>

                        <ScrollArea className="h-[400px]">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    Loading...
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <Bell className="h-12 w-12 mb-3 opacity-50" />
                                    <p>No notifications</p>
                                    <p className="text-sm">You&apos;re all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredNotifications.map((notification) => {
                                        const colors = levelColors[notification.level];
                                        const NotificationContent = (
                                            <div
                                                className={cn(
                                                    "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                                                    !notification.read && "bg-accent/30"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={cn(
                                                            "shrink-0 w-2 h-2 rounded-full mt-2",
                                                            colors.icon.replace("text-", "bg-")
                                                        )}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-medium text-sm">{notification.title}</p>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {!notification.read && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleMarkAsRead(notification.id);
                                                                        }}
                                                                        title="Mark as read"
                                                                    >
                                                                        <Check className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleDelete(notification.id);
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn("text-xs", colors.bg, colors.border)}
                                                            >
                                                                {notification.level}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {notification.category}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(notification.createdAt).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );

                                        if (notification.actionUrl) {
                                            return (
                                                <Link
                                                    key={notification.id}
                                                    href={notification.actionUrl}
                                                    onClick={() => {
                                                        if (!notification.read) {
                                                            handleMarkAsRead(notification.id);
                                                        }
                                                        setOpen(false);
                                                    }}
                                                >
                                                    {NotificationContent}
                                                </Link>
                                            );
                                        }

                                        return <div key={notification.id}>{NotificationContent}</div>;
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                </Tabs>

                <div className="border-t p-2">
                    <Button variant="ghost" className="w-full" asChild>
                        <Link href="/dashboard/settings?tab=notifications">
                            View All Settings
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
