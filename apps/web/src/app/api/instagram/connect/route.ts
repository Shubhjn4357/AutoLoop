import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const DEFAULT_SERVER_BASE_URL = "http://localhost:7860";

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return base64UrlEncode(signature);
}

async function createSignedState(userId: string, secret: string) {
  const payload = base64UrlEncode(
    JSON.stringify({
      userId,
      ts: Date.now(),
    })
  );
  const signature = await sign(payload, secret);

  return `${payload}.${signature}`;
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const apiKey = process.env.SERVER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SERVER_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const serverBaseUrl = process.env.SERVER_BASE_URL || DEFAULT_SERVER_BASE_URL;
  const connectUrl = new URL("/api/instagram/connect", serverBaseUrl);
  connectUrl.searchParams.set("state", await createSignedState(userId, apiKey));

  return NextResponse.redirect(connectUrl);
}
