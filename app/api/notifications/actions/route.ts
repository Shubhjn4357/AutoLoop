import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response-helpers";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { action, category } = body;

    if (action === "mark-all-read") {
      await NotificationService.markAllAsRead(session.user.id, category);
      return apiSuccess({ message: "All notifications marked as read" });
    }

    if (action === "delete-all-read") {
      await NotificationService.deleteAllRead(session.user.id);
      return apiSuccess({ message: "All read notifications deleted" });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    console.error("Error updating notifications:", error);
    return apiError("Failed to update notifications", 500);
  }
}
