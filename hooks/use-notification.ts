"use client";

import { useCallback } from "react";
import { sendNotification } from "@/components/notification-bell";

export function useNotification() {
    const notify = useCallback(async (
        title: string,
        message: string = "",
        type: "info" | "success" | "warning" | "error" = "info",
        options?: {
            autoClose?: boolean;
            duration?: number;
            link?: string;
            actionLabel?: string;
            persist?: boolean; // If true (default), save to DB
        }
    ) => {
        // 1. Show immediately in UI using the helper
        sendNotification({
            title,
            message,
            type,
            ...options
        });

        // 2. Persist to DB (default to true unless explicitly false)
        if (options?.persist !== false) {
            try {
                await fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        message,
                        type,
                    }),
                });
            } catch (error) {
                console.error("Failed to persist notification:", error);
            }
        }
    }, []);

    return { notify };
}
