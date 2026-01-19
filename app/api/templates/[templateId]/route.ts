
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { name, subject, body: emailBody, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(emailTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(emailTemplates.userId, userId),
            eq(emailTemplates.isDefault, true)
          )
        );
    }

    const [template] = await db
      .update(emailTemplates)
      .set({
        name,
        subject,
        body: emailBody,
        isDefault,
        updatedAt: new Date(),
      })
      .where(
        and(eq(emailTemplates.id, templateId), eq(emailTemplates.userId, userId))
      )
      .returning();

    if (!template) {
       return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const userId = session.user.id;

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(emailTemplates)
      .where(
        and(eq(emailTemplates.id, templateId), eq(emailTemplates.userId, userId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
