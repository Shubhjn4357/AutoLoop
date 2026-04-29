import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/instagram/callback`;
  
  // Scopes needed for Instagram Messaging via Graph API
  const scopes = [
    "instagram_basic",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_manage_metadata"
  ].join(",");

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${session.user.id}`;

  return NextResponse.redirect(authUrl);
}
