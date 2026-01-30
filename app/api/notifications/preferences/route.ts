import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response-helpers";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const preferences = await NotificationService.getPreferences(session.user.id);

    return apiSuccess({ preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return apiError("Failed to fetch preferences", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { category, ...preferences } = body;

    if (!category) {
      return apiError("Category is required", 400);
    }

    await NotificationService.updatePreferences(
      session.user.id,
      category,
      preferences
    );

    return apiSuccess({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return apiError("Failed to update preferences", 500);
  }
}
