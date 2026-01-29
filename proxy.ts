import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Add Security Headers (Backup to next.config.ts)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 2. Rate Limiting (Placeholder for Edge Runtime)
  // Note: True Redis-based rate limiting requires an Edge-compatible Redis client (HTTP-based)
  // or moving this logic to the application layer (route handlers).
  // We implemented the robust rate-limiting in lib/rate-limit.ts to be used in API routes.
  
  // Example of simple path-based protection
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/")) {
     // Basic check logic could go here
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
