import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateEmailTemplate } from "@/lib/gemini";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { businessType, purpose } = await request.json();

        if (!businessType || !purpose) {
            return NextResponse.json(
                { error: "Business type and purpose are required" },
                { status: 400 }
            );
        }

        // Fetch user's API key
        const [user] = await db
            .select({ geminiApiKey: users.geminiApiKey })
            .from(users)
            .where(eq(users.id, userId));

        const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not found. Please set it in Settings." },
                { status: 400 }
            );
        }

        const template = await generateEmailTemplate(businessType, purpose, apiKey);

        return NextResponse.json(template);
    } catch (error: unknown) {
        console.error("Error generating template:", error);

        let status = 500;
        let message = "Failed to generate template. Please try again.";

        if (error instanceof Error) {
            if (error.message.includes("429")) {
                status = 429;
                message = "AI generation quota exceeded. Please try again later.";
            } else if (error.message.includes("404")) {
                status = 404;
                message = "Selected AI model is currently unavailable. Please contact support.";
            } else if (error.message.includes("403")) {
                status = 403;
                message = "Invalid API Key or permissions. Please check your settings.";
            } else if (error.message.includes("503")) {
                status = 503;
                message = "AI service is temporarily overloaded. Please try again.";
            }
        }

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
