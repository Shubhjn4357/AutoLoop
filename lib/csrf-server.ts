import crypto from 'crypto';
/**
 * Server-side CSRF token management
 * Uses Next.js server APIs - only call from server components/actions
 */

import { cookies } from "next/headers";
import { generateCsrfToken } from "./csrf-utils";

/**
 * Set CSRF token in cookies (call during form render)
 * @param token CSRF token to store
 */
export async function setCsrfTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("csrf-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600, // 1 hour
        path: "/",
    });
}

/**
 * Validate CSRF token from request
 * @param token Token from form submission
 * @returns true if token is valid
 */
export async function validateCsrfToken(token: string | null | undefined): Promise<boolean> {
    if (!token || typeof token !== "string") {
        return false;
    }

    try {
        const cookieStore = await cookies();
        const storedToken = cookieStore.get("csrf-token")?.value;

        if (!storedToken) {
            return false;
        }

        // Timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(storedToken)
        ) as unknown as boolean;
    } catch {
        return false;
    }
}

/**
 * Get or create CSRF token for the current request
 * Use this in server components to ensure token exists
 */
export async function ensureCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    let token = cookieStore.get("csrf-token")?.value;

    if (!token) {
        token = generateCsrfToken();
        await setCsrfTokenCookie(token);
    }

    return token;
}
