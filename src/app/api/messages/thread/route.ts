import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getThreadMessages } from "@/lib/messages/data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get("senderId");

  if (!senderId) {
    return NextResponse.json({ error: "senderId is required" }, { status: 400 });
  }

  try {
    const messages = await getThreadMessages(session.user.id, senderId);
    return NextResponse.json({ messages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/messages/thread]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
