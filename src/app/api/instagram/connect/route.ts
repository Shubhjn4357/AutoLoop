export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=missing_meta_config`,
      303
    );
  }

  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host");
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  const redirectUri = `${baseUrl}/api/instagram/callback`;
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";
  
  const scopes = [
    "instagram_basic",
    "instagram_manage_messages",
    "instagram_manage_comments",
    "instagram_content_publish",
    "pages_show_list",
    "pages_manage_metadata",
    "pages_read_engagement"
  ].join(",");

  const authUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", session.user.id);

  return NextResponse.redirect(authUrl, 303);
}
