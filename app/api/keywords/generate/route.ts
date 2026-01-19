import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAIContent } from "@/lib/gemini";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { businessType } = await request.json();

        if (!businessType) {
            return NextResponse.json(
                { error: "Business type is required" },
                { status: 400 }
            );
        }

        // Generate keywords using Gemini
        const prompt = `Generate 8-10 relevant keyword phrases for targeting "${businessType}" businesses in a cold email outreach campaign. Return ONLY a JSON array of strings, no explanation. Example format: ["keyword 1", "keyword 2", "keyword 3"]`;

        const response = await generateAIContent(prompt);

        // Parse the JSON response
        let keywords: string[];
        try {
            keywords = JSON.parse(response);
        } catch {
            // Fallback: extract keywords from text
            const matches = response.match(/"([^"]+)"/g);
            keywords = matches ? matches.map((m: string) => m.replace(/"/g, "")) : [];
        }

        return NextResponse.json({ keywords });
    } catch (error: unknown) {
        console.error("Error generating keywords:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate keywords" },
            { status: 500 }
        );
    }
}
