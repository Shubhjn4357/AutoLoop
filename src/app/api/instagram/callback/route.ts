import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { createNotificationLog } from "@/lib/notifications/logs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // this is the userId passed from /connect
  const error = searchParams.get("error");

  if (error || !code || !state) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(new URL("/dashboard/settings?error=oauth_failed", request.url));
  }

  const session = await auth();
  if (!session?.user?.id || session.user.id !== state) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=oauth_failed", request.url));
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/instagram/callback`;
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=missing_meta_config", request.url));
  }

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("code", code);
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) throw new Error(tokenData.error?.message ?? "Token exchange failed");
    const shortLivedToken = tokenData.access_token;

    const longTokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", clientId);
    longTokenUrl.searchParams.set("client_secret", clientSecret);
    longTokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || shortLivedToken;

    const pagesUrl = new URL(`https://graph.facebook.com/${graphVersion}/me/accounts`);
    pagesUrl.searchParams.set("access_token", accessToken);
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found for this account.");
    }

    // Attempt to find a page connected to an Instagram account
    let connectedIgUserId = null;
    let connectedPageId = null;
    let pageAccessToken = null;

    for (const page of pagesData.data) {
      const igUrl = new URL(`https://graph.facebook.com/${graphVersion}/${page.id}`);
      igUrl.searchParams.set("fields", "instagram_business_account");
      igUrl.searchParams.set("access_token", page.access_token);
      const igRes = await fetch(igUrl);
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        connectedIgUserId = igData.instagram_business_account.id;
        connectedPageId = page.id;
        pageAccessToken = page.access_token; // We use the Page Access Token to reply to IG messages
        break;
      }
    }

    if (!connectedIgUserId) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=no_ig_business_found", request.url));
    }

    const existing = await db.query.instagramAccounts.findFirst({
      where: eq(instagramAccounts.userId, state)
    });

    if (existing) {
      await db.update(instagramAccounts)
        .set({
          igUserId: connectedIgUserId,
          pageId: connectedPageId,
          accessToken: pageAccessToken,
          connectedAt: new Date(),
        })
        .where(eq(instagramAccounts.userId, state));
    } else {
      await db.insert(instagramAccounts).values({
        id: crypto.randomUUID(),
        userId: state,
        igUserId: connectedIgUserId,
        pageId: connectedPageId,
        accessToken: pageAccessToken,
        connectedAt: new Date(),
      });
    }

    await createNotificationLog({
      userId: state,
      type: "instagram.connected",
      title: "Instagram connected",
      message: `Connected Instagram Business account ${connectedIgUserId}`,
      status: "success",
      metadata: { igUserId: connectedIgUserId, pageId: connectedPageId },
    });

    return NextResponse.redirect(new URL("/dashboard/settings?success=1", request.url));
  } catch (err) {
    console.error("IG Auth Error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=internal_auth_error", request.url));
  }
}
