"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/store/notifications";

export function DemoNotifications() {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Add a welcome notification after 2 seconds
    const timer = setTimeout(() => {
      addNotification({
        type: "success",
        title: "Welcome to AutoLoop!",
        message: "Your dashboard is ready. Start by creating your first campaign.",
        autoClose: true,
        duration: 6000,
        link: "/dashboard/tasks",
        actionLabel: "Get Started"
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [addNotification]);

  return null;
}
