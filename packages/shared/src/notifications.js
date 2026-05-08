import { db, notificationLogs, eq, desc } from "@autoloop/db";
export async function createNotificationLog({ userId, type, title, message, status = "info", metadata, }) {
    try {
        await db.insert(notificationLogs).values({
            id: crypto.randomUUID(),
            userId,
            type,
            title,
            message,
            status,
            metadata: metadata ? JSON.stringify(metadata) : null,
            createdAt: new Date(),
        });
    }
    catch (error) {
        console.error("[NotificationLog] Failed to persist log", error);
    }
}
export async function getNotificationLogs(userId, limit = 25) {
    return db.query.notificationLogs.findMany({
        where: eq(notificationLogs.userId, userId),
        orderBy: [desc(notificationLogs.createdAt)],
        limit,
    });
}
