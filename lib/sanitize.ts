import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(input: string | null | undefined): string {
    return sanitizeString(input, false);
}

export function sanitizeInput(input: string | null | undefined): string {
    return sanitizeString(input, true);
}

export function sanitizeUrl(input: string | null | undefined): string {
    if (!input || typeof input !== "string") {
        return "";
    }
    try {
        // Try to parse as URL to validate
        const parsed = new URL(input);
        // Only allow http and https protocols
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return "";
        }
        return input;
    } catch (error) {
        // Not a valid absolute URL, might be relative
        // Check for javascript: or data: protocols in relative URLs
        if (input.startsWith("javascript:") || input.startsWith("data:")) {
            return "";
        }
        return input;
    }
}

/**
 * Sanitize a single string to prevent XSS attacks
 * Note: Requires isomorphic-dompurify to be installed
 * Install with: pnpm add isomorphic-dompurify
 * @param input - String to sanitize
 * @param strict - If true, removes all HTML tags. If false, allows safe tags
 * @returns Sanitized string
 */
export function sanitizeString(
    input: string | null | undefined,
    strict: boolean = false
): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    try {

        if (strict) {
            // Remove all HTML tags
            return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
        }

        // Allow safe HTML tags
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: [
                "b",
                "i",
                "em",
                "strong",
                "u",
                "br",
                "p",
                "ul",
                "ol",
                "li",
                "a",
            ],
            ALLOWED_ATTR: ["href", "target", "rel"],
        });
    } catch (error) {
        // Fallback: basic HTML entity encoding
        return encodeHtmlEntities(input);
    }
}

/**
 * Recursively sanitize all string values in an object
 * Useful for sanitizing API request bodies
 * @param obj - Object to sanitize
 * @param strict - Apply strict sanitization
 * @returns New sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T | null | undefined,
    strict: boolean = false
): T {
    if (!obj || typeof obj !== "object") {
        return {} as T;
    }

    const sanitized: Record<string, unknown> = { ...obj };

    for (const key in sanitized) {
        const value = sanitized[key];

        if (typeof value === "string") {
            sanitized[key] = sanitizeString(value, strict);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === "string" ? sanitizeString(item, strict) : item
            );
        } else if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            sanitized[key] = sanitizeObject(
                value as Record<string, unknown>,
                strict
            );
        }
    }

    return sanitized as T;
}

/**
 * Sanitize email address
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
    if (!email || typeof email !== "string") {
        return "";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();

    return emailRegex.test(sanitized) ? sanitized : "";
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(
    filename: string | null | undefined
): string {
    if (!filename || typeof filename !== "string") {
        return "file";
    }

    // Remove path separators and special characters
    return filename
        .replace(/[/\\]/g, "")
        .replace(/\.\./g, "")
        .replace(/[^\w\s.-]/g, "")
        .trim()
        .substring(0, 255) // Limit filename length
        .replace(/^\.+/, ""); // Remove leading dots
}

/**
 * Sanitize input for database searches (prevent SQL-like injection in user input)
 * @param input - User input
 * @returns Safe search string
 */
export function sanitizeSearchInput(
    input: string | null | undefined
): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    // Remove special characters that could be part of SQL injection attempts
    return input
        .trim()
        .replace(/['"`]/g, "")
        .replace(/[\r\n]/g, " ")
        .substring(0, 200); // Limit search length
}

/**
 * Sanitize JSON field to prevent injection
 * @param input - Input string
 * @returns Safe JSON-ready string
 */
export function sanitizeJsonField(
    input: string | null | undefined
): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    return input
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

/**
 * Validate and sanitize phone number
 * @param phone - Phone number
 * @returns Sanitized phone or empty string if invalid
 */
export function sanitizePhoneNumber(
    phone: string | null | undefined
): string {
    if (!phone || typeof phone !== "string") {
        return "";
    }

    // Keep only digits, +, -, (, ), and spaces
    const sanitized = phone.replace(/[^\d+\-().\s]/g, "").trim();

    // Basic validation: should have at least 7 digits
    const digitCount = (sanitized.match(/\d/g) || []).length;
    return digitCount >= 7 ? sanitized : "";
}

/**
 * Helper: Encode HTML entities (fallback for DOMPurify)
 * @param str - String to encode
 * @returns HTML entity encoded string
 */
function encodeHtmlEntities(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}
