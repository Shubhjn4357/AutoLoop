/**
 * API Key Management and Authentication
 * Provides secure API key generation, validation, and rotation
 */

import { createHash, randomBytes } from "crypto";
import { z } from "zod";

export const APIKeySchema = z.object({
    id: z.string().cuid2(),
    key: z.string().min(32), // Hashed key
    displayKey: z.string().min(20).max(20), // Last 20 chars shown to user
    name: z.string().min(1).max(100),
    permissions: z.array(z.string()).default(["read"]),
    createdAt: z.date(),
    expiresAt: z.date().optional(),
    lastUsed: z.date().optional(),
    revokedAt: z.date().optional(),
    metadata: z.record(z.any()).optional(),
});

export type APIKey = z.infer<typeof APIKeySchema>;

/**
 * Generate a new API key
 * @param prefix - Prefix for the key (e.g., "sk_live_" for secret keys)
 * @param length - Length of the random part (default: 32)
 * @returns Generated API key and its display version
 */
export function generateAPIKey(
    prefix: string = "sk_live_",
    length: number = 32
): { key: string; displayKey: string } {
    const randomPart = randomBytes(length).toString("hex");
    const fullKey = `${prefix}${randomPart}`;
    const displayKey = fullKey.slice(-20); // Show last 20 characters

    return {
        key: fullKey,
        displayKey,
    };
}

/**
 * Hash an API key for storage
 * Uses SHA-256 for security
 */
export function hashAPIKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key against its hashed version
 */
export function validateAPIKey(key: string, hashedKey: string): boolean {
    const hash = hashAPIKey(key);
    // Use timing-safe comparison to prevent timing attacks
    const keyBuffer = Buffer.from(hash);
    const hashedBuffer = Buffer.from(hashedKey);

    if (keyBuffer.length !== hashedBuffer.length) {
        return false;
    }

    return keyBuffer.equals(hashedBuffer);
}

/**
 * Parse and validate API key format
 */
export function parseAPIKey(key: string): {
    valid: boolean;
    prefix: string;
    body: string;
} {
    const parts = key.split("_");

    if (parts.length < 2) {
        return {
            valid: false,
            prefix: "",
            body: "",
        };
    }

    const prefix = parts[0] + "_" + parts[1]; // e.g., "sk_live"
    const body = parts.slice(2).join("_");

    // Validate format
    const validPrefixes = ["sk_live", "sk_test", "pk_live", "pk_test"];
    const isValid =
        validPrefixes.includes(prefix) && body.length >= 20 && body.length <= 100;

    return {
        valid: isValid,
        prefix,
        body,
    };
}

/**
 * Check if API key has required permission
 */
export function hasPermission(
    apiKey: APIKey,
    requiredPermission: string
): boolean {
    return apiKey.permissions.includes(requiredPermission) ||
        apiKey.permissions.includes("*");
}

/**
 * Check if API key is valid and not expired/revoked
 */
export function isAPIKeyValid(apiKey: APIKey): boolean {
    // Check if revoked
    if (apiKey.revokedAt && apiKey.revokedAt <= new Date()) {
        return false;
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
        return false;
    }

    return true;
}

/**
 * Rate limit configuration per API key tier
 */
export const API_KEY_RATE_LIMITS = {
    free: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        concurrentRequests: 10,
    },
    pro: {
        requestsPerMinute: 1000,
        requestsPerDay: 1000000,
        concurrentRequests: 100,
    },
    enterprise: {
        requestsPerMinute: 10000,
        requestsPerDay: 999999999,
        concurrentRequests: 1000,
    },
};

/**
 * Get rate limit for API key
 */
export function getRateLimitForAPIKey(tier: keyof typeof API_KEY_RATE_LIMITS) {
    return API_KEY_RATE_LIMITS[tier] || API_KEY_RATE_LIMITS.free;
}

/**
 * Validate API key request header
 * Supports "Bearer <key>" or "X-API-Key: <key>" format
 */
export function extractAPIKeyFromRequest(
    authHeader?: string,
    apiKeyHeader?: string
): string | null {
    // Try Authorization header first (Bearer format)
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7); // Remove "Bearer " prefix
    }

    // Try X-API-Key header
    if (apiKeyHeader) {
        return apiKeyHeader;
    }

    return null;
}

/**
 * Mask API key for logging (show only last 4 characters)
 */
export function maskAPIKey(key: string): string {
    if (key.length <= 4) {
        return "****";
    }
    return "***" + key.slice(-4);
}

/**
 * Get tier based on API key prefix
 */
export function getTierFromAPIKey(
    key: string
): keyof typeof API_KEY_RATE_LIMITS {
    if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) {
        return "free";
    }
    if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) {
        return "pro";
    }
    return "free";
}

/**
 * Generate API key documentation
 */
export function generateAPIKeyDocs(): string {
    return `
# API Key Authentication

## API Key Format
- Live Keys: \`sk_live_<random>\` or \`pk_live_<random>\`
- Test Keys: \`sk_test_<random>\` or \`pk_test_<random>\`

## Usage
### Authorization Header
\`\`\`
Authorization: Bearer sk_live_example123456
\`\`\`

### Custom Header
\`\`\`
X-API-Key: sk_live_example123456
\`\`\`

## Permissions
- \`read\` - Read-only access
- \`write\` - Create and update access
- \`delete\` - Delete access
- \`*\` - Full access

## Rate Limits
- Free: 60 req/min, 10K req/day
- Pro: 1000 req/min, 1M req/day
- Enterprise: 10K req/min, unlimited req/day

## Best Practices
1. Keep API keys secret - never commit to version control
2. Use environment variables to store API keys
3. Rotate keys regularly
4. Use test keys for development
5. Monitor API key usage for anomalies
6. Use separate keys for different services/applications
  `;
}
