import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ provider: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
  const { provider } = await params;

  // Dynamic Base URL Detection
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const effectiveBaseUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("0.0.0.0"))
    ? process.env.NEXT_PUBLIC_APP_URL 
      : baseUrl;

  if (provider === "facebook" || provider === "instagram") {
  // Both use Facebook Login
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${effectiveBaseUrl}/api/social/callback/facebook`;
    const state = JSON.stringify({ userId: session.user.id, provider }); // Pass provider to know intent if needed

    // Scopes for Business Suite
    const scope = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts", // For posting
      "instagram_basic", // For IG info
      "instagram_content_publish", // For IG posting
      "business_management", // General access
    ].join(",");

    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}&scope=${scope}`;
    
    return NextResponse.redirect(url);
  }

  if (provider === "linkedin") {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${effectiveBaseUrl}/api/social/callback/linkedin`;
    const state = JSON.stringify({ userId: session.user.id, provider });

    // LinkedIn Scopes (v2)
    // w_member_social: Create posts
    // openid, profile, email: Authentication
    const scope = ["openid", "profile", "w_member_social", "email"].join(" "); // space separated

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(url);
  }

  if (provider === "youtube") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${effectiveBaseUrl}/api/social/callback/youtube`;
    const state = JSON.stringify({ userId: session.user.id, provider });

    // YouTube Scopes
    const scope = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube" // Full access managed
    ].join(" ");

    const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
}
