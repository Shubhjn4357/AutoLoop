import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { notificationLogs } from "@/lib/db/schema";

export type NotificationStatus = "info" | "success" | "warning" | "error";

interface CreateNotificationLogInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
}

export async function createNotificationLog({
  userId,
  type,
  title,
  message,
  status = "info",
  metadata,
}: CreateNotificationLogInput) {
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
  } catch (error) {
    console.error("[NotificationLog] Failed to persist log", error);
  }
}

export async function getNotificationLogs(userId: string, limit = 25) {
  return db.query.notificationLogs.findMany({
    where: eq(notificationLogs.userId, userId),
    orderBy: [desc(notificationLogs.createdAt)],
    limit,
  });
}

