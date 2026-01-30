import crypto from 'crypto'
/**
 * CSRF Token Utilities - Browser/Node compatible
 * Safe to use in both server and client contexts
 */

/**
 * Generate a new CSRF token
 * Works in both client and server
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
    // Browser: use crypto.getRandomValues if available
    if (typeof window !== "undefined" && typeof window.crypto !== "undefined") {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
    }

    // Node.js: use crypto.randomBytes
    if (typeof global !== "undefined") {
        try {

            return crypto.randomBytes(32).toString("hex");
        } catch {
            // Fallback if crypto module not available
        }
    }

    // Fallback for environments without crypto
    return Array.from({ length: 32 })
        .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, "0"))
        .join("");
}
