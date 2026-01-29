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
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/facebook`;
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
