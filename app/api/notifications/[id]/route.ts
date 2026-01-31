import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response-helpers";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id } = params;

    await NotificationService.markAsRead(id, session.user.id);

    return apiSuccess({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    return apiError("Failed to update notification", 500);
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id } = params;

    await NotificationService.delete(id, session.user.id);

    return apiSuccess({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return apiError("Failed to delete notification", 500);
  }
}
