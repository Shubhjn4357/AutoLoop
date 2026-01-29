import { NextRequest, NextResponse } from "next/server";
import { generateAIContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, context } = await req.json();

    let finalPrompt = "";
    if (type === "caption") {
      finalPrompt = `Write ONE verified, engaging social media caption for a post about: "${prompt}". 
        Context: ${context || "None"}. 
        Include relevant hashtags. Keep it under 280 characters. Do not provide multiple options.`;
    } else if (type === "tags") {
      finalPrompt = `Generate 15 relevant, high-traffic, trending hashtags for a social media post about: "${prompt}". 
      Context: ${context || "None"}.
      Return ONLY a comma-separated list of tags without the '#' symbol. Example: technology, coding, developer. Do not include numbered lists or extra text.`;
    } else {
      finalPrompt = `Generate content for a social media post about: "${prompt}". Context: ${context}.`;
    }

    const text = await generateAIContent(finalPrompt);

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
