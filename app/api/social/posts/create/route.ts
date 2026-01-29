import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialPosts, connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publishToFacebook, publishToInstagram } from "@/lib/social/publisher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { connectedAccountId, content, mediaUrls, platform } = body;

    if (!connectedAccountId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Connected Account to get Access Token
    const account = await db.query.connectedAccounts.findFirst({
      where: eq(connectedAccounts.id, connectedAccountId)
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // 2. Publish Immediately (MVP - no scheduling yet, just instant post)
    // In future: Check if scheduledAt, if so, save as 'scheduled' and return.

    let result;
    if (platform === "facebook") {
      result = await publishToFacebook({
        accessToken: account.accessToken,
        providerAccountId: account.providerAccountId,
        content,
        mediaUrls
      });
    } else if (platform === "instagram") {
      // Find IG Account ID linked (for now assume providerAccountId IS the target or we query it)
      // With the current flow, if user selected "Instagram", providerAccountId should be the IG User ID.
      // We'll trust the selector.
      result = await publishToInstagram({
        accessToken: account.accessToken,
        providerAccountId: account.providerAccountId,
        content,
        mediaUrls
      });
    }

    // 3. Save to DB
    await db.insert(socialPosts).values({
      userId: session.user.id,
      connectedAccountId: account.id,
      content,
      mediaUrls,
      platform,
      status: "published",
      publishedAt: new Date(),
      platformPostId: result?.id
    });

    return NextResponse.json({ success: true, postId: result?.id });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Post Creation Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
