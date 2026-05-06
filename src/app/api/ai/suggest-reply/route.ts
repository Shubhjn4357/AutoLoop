import { NextResponse } from "next/server";
import { generateSmartReply } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
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

    const history = thread.reverse().map(m => ({
      role: (m.direction === "inbound" ? "user" : "model") as "user" | "model",
      content: m.text,
    }));

    const suggestion = await generateSmartReply(history);
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("[AI API] Suggestion failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
