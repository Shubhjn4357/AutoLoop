import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getThreadMessages } from "@/lib/messages/data";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const senderId = request.nextUrl.searchParams.get("senderId");
  if (!senderId) {
    return NextResponse.json({ error: "Missing senderId" }, { status: 400 });
  }

  const messages = await getThreadMessages(userId, senderId);

  return NextResponse.json({ messages });
}
