import { auth } from "@/lib/auth";
import { db } from "@/db";
import { socialAutomations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-response-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id } = params;

    // Verify ownership before deleting
    const automation = await db.query.socialAutomations.findFirst({
      where: and(
        eq(socialAutomations.id, id),
        eq(socialAutomations.userId, session.user.id)
      ),
    });

    if (!automation) {
      return apiError("Automation not found or access denied", 404);
    }

    // Delete the automation
    await db
      .delete(socialAutomations)
      .where(eq(socialAutomations.id, id));

    return apiSuccess({ message: "Automation deleted successfully" });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return apiError("Failed to delete automation", 500);
  }
}
