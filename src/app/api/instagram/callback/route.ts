import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // this is the userId passed from /connect
  const error = searchParams.get("error");

  if (error || !code || !state) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(new URL("/dashboard/settings?error=oauth_failed", request.url));
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/instagram/callback`;

  try {
    // 1. Exchange code for short-lived access token
    const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) throw new Error(tokenData.error.message);
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived access token
    const longTokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`);
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || shortLivedToken;

    // 3. Get connected Facebook Pages for the user
    // (Requires pages_show_list scope)
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found for this account.");
    }

    // Attempt to find a page connected to an Instagram account
    let connectedIgUserId = null;
    let connectedPageId = null;
    let pageAccessToken = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(`https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
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

    // 4. Save to Database
    // Check if it already exists
    const existing = await db.query.instagramAccounts.findFirst({
      where: eq(instagramAccounts.userId, state)
    });

    if (existing) {
      await db.update(instagramAccounts)
        .set({ igUserId: connectedIgUserId, pageId: connectedPageId, accessToken: pageAccessToken })
        .where(eq(instagramAccounts.userId, state));
    } else {
      await db.insert(instagramAccounts).values({
        id: crypto.randomUUID(),
        userId: state,
        igUserId: connectedIgUserId,
        pageId: connectedPageId,
        accessToken: pageAccessToken
      });
    }

    return NextResponse.redirect(new URL("/dashboard/settings?success=1", request.url));
  } catch (err) {
    console.error("IG Auth Error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=internal_auth_error", request.url));
  }
}
