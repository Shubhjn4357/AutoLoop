import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { publishIGPost } from "@/lib/instagram/graph";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { imageUrl, caption } = body as { imageUrl?: string; caption?: string };

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const account = await db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.userId, session.user.id),
  });

  if (!account?.externalId || !account?.accessToken) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  try {
    const result = await publishIGPost(
      account.externalId,
      account.accessToken,
      imageUrl,
      caption ?? ""
    );
    return NextResponse.json({ success: true, postId: result.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/instagram/publish]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
