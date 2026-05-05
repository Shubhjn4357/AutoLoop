import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { searchIGUser } from "@/lib/instagram/graph";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  // Find a connected account to use for Business Discovery
  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  if (!account || !account.accessToken || !account.igUserId) {
    return NextResponse.json(
      { error: "Instagram account not connected" },
      { status: 400 }
    );
  }

  try {
    const data = await searchIGUser(
      account.igUserId,
      account.accessToken,
      username
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("[SearchIGUser] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search user" },
      { status: 500 }
    );
  }
}
