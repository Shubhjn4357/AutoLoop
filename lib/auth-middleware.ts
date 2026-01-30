/**
 * Auth middleware for rate limiting on auth endpoints
 */
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Wrap auth handlers with rate limiting
 * Apply strict limits to prevent brute force attacks
 */
export async function withAuthRateLimit(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
) {
    // Determine auth context based on request path
    let rateLimitContext: "auth_login" | "auth_signup" = "auth_login";

    if (req.nextUrl.pathname.includes("signup")) {
        rateLimitContext = "auth_signup";
    }

    // Check rate limit
    const { limited, response } = await checkRateLimit(req, rateLimitContext);
    if (limited) {
        return response!;
    }

    // Proceed with auth handler
    return handler(req);
}

/**
 * Rate limit contexts for auth endpoints
 * All configured in lib/rate-limit.ts
 */
export const AUTH_RATE_LIMIT_CONTEXTS = {
    signin: "auth_login",
    signup: "auth_signup",
} as const;
