import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
  const { provider } = await params;

  if (provider === "facebook" || provider === "instagram") {
    // Both use Facebook Login
    // Dynamic Base URL Detection for Spaces/Docker
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "https"; // Default to https for safety in prod
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;

    // Fallback if configured explicitly, otherwise dynamic
    const effectiveBaseUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("0.0.0.0"))
      ? process.env.NEXT_PUBLIC_APP_URL
      : baseUrl;

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

  return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
}
