
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateEmailTemplate } from "@/lib/gemini";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId))
      .orderBy(emailTemplates.createdAt);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { name, subject, body: emailBody, isDefault, generateWithAI, prompt } = body;

    let finalSubject = subject;
    let finalBody = emailBody;

    // Generate with AI if requested
    if (generateWithAI && prompt) {
      const generated = await generateEmailTemplate(prompt, "cold outreach");
      finalSubject = generated.subject;
      finalBody = generated.body;
    }

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
      .insert(emailTemplates)
      .values({
        userId,
        name,
        subject: finalSubject,
        body: finalBody,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
