import { db } from "@/db";
import { notifications, notificationPreferences } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export type NotificationCategory = "workflow" | "social" | "email" | "system" | "task";
export type NotificationLevel = "info" | "success" | "warning" | "error";

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    level: NotificationLevel;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}

export class NotificationService {
    /**
     * Create a new notification
     */
    static async create(params: CreateNotificationParams) {
        const notification = await db.insert(notifications).values({
            id: nanoid(),
            userId: params.userId,
            title: params.title,
            message: params.message,
            category: params.category,
            level: params.level,
            read: false,
            actionUrl: params.actionUrl,
            metadata: params.metadata as unknown,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return notification[0];
    }

    /**
     * Get notifications for a user
     */
    static async getForUser(
        userId: string,
        options?: {
            category?: NotificationCategory;
            limit?: number;
            offset?: number;
        }
    ) {
        const { category, limit = 50, offset = 0 } = options || {};

        let query = db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);

        if (category) {
            query = db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.userId, userId),
                        eq(notifications.category, category)
                    )
                )
                .orderBy(desc(notifications.createdAt))
                .limit(limit)
                .offset(offset);
        }

        return await query;
    }

    /**
     * Get unread count for a user
     */
    static async getUnreadCount(userId: string, category?: NotificationCategory) {
        const conditions = category
            ? and(
                eq(notifications.userId, userId),
                eq(notifications.read, false),
                eq(notifications.category, category)
            )
            : and(eq(notifications.userId, userId), eq(notifications.read, false));

        const result = await db
            .select()
            .from(notifications)
            .where(conditions);

        return result.length;
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId: string, userId: string) {
        await db
            .update(notifications)
            .set({ read: true, updatedAt: new Date() })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId)
                )
            );
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(userId: string, category?: NotificationCategory) {
        const conditions = category
            ? and(
                eq(notifications.userId, userId),
                eq(notifications.category, category)
            )
            : eq(notifications.userId, userId);

        await db
            .update(notifications)
            .set({ read: true, updatedAt: new Date() })
            .where(conditions);
    }

    /**
     * Delete a notification
     */
    static async delete(notificationId: string, userId: string) {
        await db
            .delete(notifications)
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId)
                )
            );
    }

    /**
     * Delete all read notifications
     */
    static async deleteAllRead(userId: string) {
        await db
            .delete(notifications)
            .where(
                and(eq(notifications.userId, userId), eq(notifications.read, true))
            );
    }

    /**
     * Get user preferences
     */
    static async getPreferences(userId: string) {
        const prefs = await db
            .select()
            .from(notificationPreferences)
            .where(eq(notificationPreferences.userId, userId));

        return prefs;
    }

    /**
     * Update user preferences for a category
     */
    static async updatePreferences(
        userId: string,
        category: NotificationCategory,
        preferences: {
            emailEnabled?: boolean;
            pushEnabled?: boolean;
            inAppEnabled?: boolean;
            soundEnabled?: boolean;
            desktopEnabled?: boolean;
        }
    ) {
        // Check if preference exists
        const existing = await db
            .select()
            .from(notificationPreferences)
            .where(
                and(
                    eq(notificationPreferences.userId, userId),
                    eq(notificationPreferences.category, category)
                )
            );

        if (existing.length > 0) {
            // Update
            await db
                .update(notificationPreferences)
                .set({ ...preferences, updatedAt: new Date() })
                .where(
                    and(
                        eq(notificationPreferences.userId, userId),
                        eq(notificationPreferences.category, category)
                    )
                );
        } else {
            // Create
            await db.insert(notificationPreferences).values({
                id: nanoid(),
                userId,
                category,
                emailEnabled: preferences.emailEnabled ?? true,
                pushEnabled: preferences.pushEnabled ?? false,
                inAppEnabled: preferences.inAppEnabled ?? true,
                soundEnabled: preferences.soundEnabled ?? true,
                desktopEnabled: preferences.desktopEnabled ?? false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    /**
     * Initialize default preferences for a user
     */
    static async initializeDefaultPreferences(userId: string) {
        const categories: NotificationCategory[] = ["workflow", "social", "email", "system", "task"];

        for (const category of categories) {
            const existing = await db
                .select()
                .from(notificationPreferences)
                .where(
                    and(
                        eq(notificationPreferences.userId, userId),
                        eq(notificationPreferences.category, category)
                    )
                );

            if (existing.length === 0) {
                await db.insert(notificationPreferences).values({
                    id: nanoid(),
                    userId,
                    category,
                    emailEnabled: true,
                    pushEnabled: false,
                    inAppEnabled: true,
                    soundEnabled: true,
                    desktopEnabled: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    }
}
