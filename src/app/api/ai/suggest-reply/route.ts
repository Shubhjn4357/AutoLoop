import { NextResponse } from "next/server";
import { generateSmartReply } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { senderId } = await req.json();
    if (!senderId) return new NextResponse("Missing senderId", { status: 400 });

    const thread = await db.query.messages.findMany({
      where: eq(messages.senderId, senderId),
      orderBy: [desc(messages.timestamp)],
      limit: 10,
    });

    if (thread.length === 0) {
      return new NextResponse("No messages found", { status: 404 });
    }

    // Get the last user message
    const lastMessage = thread.find(m => m.direction === "inbound");
    if (!lastMessage) {
      return new NextResponse("No user message found", { status: 404 });
    }

    // Build conversation context
    const history = thread.reverse().map(m => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.text,
    }));

    const result = await generateSmartReply({
      userMessage: lastMessage.text,
      context: JSON.stringify({ history }),
    });

    return NextResponse.json({ suggestion: result?.reply ?? null });
  } catch (error) {
    console.error("[AI API] Suggestion failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
