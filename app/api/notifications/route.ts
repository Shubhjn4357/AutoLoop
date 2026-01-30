import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response-helpers";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const category = categoryParam as "workflow" | "social" | "email" | "system" | "task" | undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const notifications = await NotificationService.getForUser(session.user.id, {
      category: category || undefined,
      limit,
      offset,
    });

    const unreadCount = await NotificationService.getUnreadCount(session.user.id);

    return apiSuccess({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return apiError("Failed to fetch notifications", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { title, message, category, level, actionUrl, metadata } = body;

    if (!title || !message || !category || !level) {
      return apiError("Missing required fields", 400);
    }

    const notification = await NotificationService.create({
      userId: session.user.id,
      title,
      message,
      category,
      level,
      actionUrl,
      metadata,
    });

    return apiSuccess({ notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return apiError("Failed to create notification", 500);
  }
}
