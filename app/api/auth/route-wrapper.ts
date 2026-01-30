/**
 * Enhanced auth routes with rate limiting on sensitive endpoints
 * Apply stricter limits to prevent brute force attacks
 */
import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Wrap the NextAuth handlers with rate limiting
const originalGET = handlers.GET;
const originalPOST = handlers.POST;

/**
 * Rate-limited GET handler
 */
async function GET(req: NextRequest) {
    // Only rate limit on sign-in/callback flows
    const pathname = req.nextUrl.pathname;

    if (pathname.includes("signin") || pathname.includes("callback")) {
        const { limited, response } = await checkRateLimit(req, "auth_login");
        if (limited) return response!;
    }

    return originalGET(req);
}

/**
 * Rate-limited POST handler
 */
async function POST(req: NextRequest) {
    // Rate limit on sign-in and sign-up
    const pathname = req.nextUrl.pathname;
    let rateLimitContext: "auth_login" | "auth_signup" = "auth_login";

    if (pathname.includes("signin")) {
        rateLimitContext = "auth_login"; // 5 attempts per minute
    } else if (pathname.includes("signup")) {
        rateLimitContext = "auth_signup"; // 3 attempts per 5 minutes
    } else if (pathname.includes("callback")) {
        rateLimitContext = "auth_login";
    }

    const { limited, response } = await checkRateLimit(req, rateLimitContext);
    if (limited) return response!;

    return originalPOST(req);
}

export { GET, POST };
