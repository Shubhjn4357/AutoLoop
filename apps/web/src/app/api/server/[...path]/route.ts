import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const DEFAULT_SERVER_BASE_URL = "http://localhost:7860";

function getServerBaseUrl() {
  return process.env.SERVER_BASE_URL || DEFAULT_SERVER_BASE_URL;
}

function getServerApiKey() {
  return process.env.SERVER_API_KEY;
}

function buildUpstreamUrl(request: NextRequest, path: string[], userId: string) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(`/api/${path.join("/")}`, getServerBaseUrl());

  requestUrl.searchParams.forEach((value, key) => {
    if (key !== "userId") {
      upstreamUrl.searchParams.append(key, value);
    }
  });
  upstreamUrl.searchParams.set("userId", userId);

  return upstreamUrl;
}

async function buildBody(request: NextRequest, userId: string) {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const contentType = request.headers.get("content-type") ?? "";
  const rawBody = await request.text();

  if (contentType.includes("application/json")) {
    const parsed = rawBody ? JSON.parse(rawBody) : {};
    return JSON.stringify({ ...parsed, userId });
  }

  return rawBody || undefined;
}

async function proxyToServer(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getServerApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "SERVER_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const upstreamUrl = buildUpstreamUrl(request, path, userId);
  const body = await buildBody(request, userId);
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  headers.set("x-server-api-key", apiKey);
  headers.set("accept", "application/json");
  if (contentType) {
    headers.set("content-type", contentType);
  } else if (body) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  if (responseType) {
    responseHeaders.set("content-type", responseType);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToServer(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToServer(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToServer(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToServer(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToServer(request, context);
}
