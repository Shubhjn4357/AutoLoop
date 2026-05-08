export type NotificationStatus = "info" | "success" | "warning" | "error";
interface CreateNotificationLogInput {
    userId: string;
    type: string;
    title: string;
    message: string;
    status?: NotificationStatus;
    metadata?: Record<string, unknown>;
}
export declare function createNotificationLog({ userId, type, title, message, status, metadata, }: CreateNotificationLogInput): Promise<void>;
export declare function getNotificationLogs(userId: string, limit?: number): Promise<{
    status: string;
    id: string;
    userId: string;
    type: string;
    createdAt: Date;
    title: string;
    message: string;
    metadata: string | null;
}[]>;
export {};
