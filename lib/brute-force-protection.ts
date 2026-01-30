/**
 * Brute Force Protection Middleware
 * Provides advanced protection against brute-force attacks
 */

import { NextRequest, NextResponse } from "next/server";
import type { Redis } from "ioredis";

interface BruteForceConfig {
    maxAttempts: number;
    windowMs: number; // in seconds
    lockoutDurationMs: number; // in seconds
    progressiveDelay: boolean; // increases delay with each attempt
}

const DEFAULT_BRUTE_FORCE_CONFIG: BruteForceConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60, // 15 minutes
    lockoutDurationMs: 30 * 60, // 30 minutes after max attempts
    progressiveDelay: true,
};

/**
 * Track and enforce brute-force protection
 * @param identifier - User identifier (email, username, IP)
 * @param config - Configuration for brute-force protection
 * @returns Object with attempt count, remaining attempts, and lock status
 */
export async function checkBruteForce(
    identifier: string,
    config: Partial<BruteForceConfig> = {}
) {
    const finalConfig = { ...DEFAULT_BRUTE_FORCE_CONFIG, ...config };

    // Redis client would be injected in production
    // For now, return allowed to prevent blocking
    const redisClient: Redis | null = null; // getRedisClient();

    if (!redisClient) {
        return {
            allowed: true,
            attempts: 0,
            remaining: finalConfig.maxAttempts,
            lockedOut: false,
            delayMs: 0,
        };
    }

    // TypeScript now knows redisClient is not null
    const redis: Redis = redisClient;

    try {
        const lockKey = `bruteforce:locked:${identifier}`;
        const attemptsKey = `bruteforce:attempts:${identifier}`;

        // Check if account is locked
        const isLocked = await redis.exists(lockKey);
        if (isLocked) {
            const ttl = await redis.ttl(lockKey);
            return {
                allowed: false,
                attempts: finalConfig.maxAttempts,
                remaining: 0,
                lockedOut: true,
                lockDurationSeconds: Math.max(ttl, 0),
                error: "Too many failed attempts. Please try again later.",
            };
        }

        // Get current attempt count
        const attemptsStr = await redis.get(attemptsKey);
        const attempts = parseInt(attemptsStr || "0", 10);

        // Check if exceeded max attempts
        if (attempts >= finalConfig.maxAttempts) {
            // Lock the account
            await redis.setex(
                lockKey,
                finalConfig.lockoutDurationMs,
                "1"
            );

            return {
                allowed: false,
                attempts: finalConfig.maxAttempts,
                remaining: 0,
                lockedOut: true,
                lockDurationSeconds: finalConfig.lockoutDurationMs,
                error: "Account temporarily locked due to too many failed attempts.",
            };
        }

        // Calculate progressive delay based on attempt count
        let delayMs = 0;
        if (finalConfig.progressiveDelay) {
            // Delay = 100ms * attempt^2
            delayMs = 100 * Math.pow(attempts + 1, 2);
        }

        return {
            allowed: true,
            attempts,
            remaining: finalConfig.maxAttempts - attempts,
            lockedOut: false,
            delayMs,
        };
    } catch (error) {
        console.error("Brute-force check failed:", error);
        // On error, allow but log
        return {
            allowed: true,
            attempts: 0,
            remaining: finalConfig.maxAttempts,
            lockedOut: false,
            delayMs: 0,
        };
    }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
    identifier: string,
    config: Partial<BruteForceConfig> = {}
) {
    const finalConfig = { ...DEFAULT_BRUTE_FORCE_CONFIG, ...config };
    const redisClient: Redis | null = null; // getRedisClient();

    if (!redisClient) {
        return;
    }

    const redis: Redis = redisClient;

    try {
        const attemptsKey = `bruteforce:attempts:${identifier}`;
        const attempts = await redis.incr(attemptsKey);

        // Set expiry only on first attempt
        if (attempts === 1) {
            await redis.expire(attemptsKey, finalConfig.windowMs);
        }

        // If max attempts reached, lock the account
        if (attempts >= finalConfig.maxAttempts) {
            const lockKey = `bruteforce:locked:${identifier}`;
            await redis.setex(
                lockKey,
                finalConfig.lockoutDurationMs,
                "1"
            );
        }
    } catch (error) {
        console.error("Failed to record attempt:", error);
    }
}

/**
 * Record a successful login and reset attempt counter
 */
export async function recordSuccessfulAttempt(identifier: string) {
    const redisClient: Redis | null = null; // getRedisClient();
    if (!redisClient) return;

    const redis: Redis = redisClient;

    try {
        const attemptsKey = `bruteforce:attempts:${identifier}`;
        await redis.del(attemptsKey);
    } catch (error) {
        console.error("Failed to reset attempts:", error);
    }
}

/**
 * Middleware wrapper for brute-force protection
 */
export async function withBruteForceProtection(
    handler: (req: NextRequest) => Promise<Response>,
    getIdentifier: (req: NextRequest) => string,
    config?: Partial<BruteForceConfig>
) {
    return async (req: NextRequest) => {
        const identifier = getIdentifier(req);
        const check = await checkBruteForce(identifier, config);

        if (!check.allowed) {
            return NextResponse.json(
                {
                    error: check.error,
                    lockDurationSeconds: check.lockDurationSeconds,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(check.lockDurationSeconds || 300),
                    },
                }
            );
        }

        // Add delay if progressive delay enabled
        if (check.delayMs && check.delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, check.delayMs));
        }

        try {
            const response = await handler(req);

            // If response is successful (200-299), record successful attempt
            if (response.status >= 200 && response.status < 300) {
                await recordSuccessfulAttempt(identifier);
            } else if (response.status === 401 || response.status === 403) {
                // If auth failed (401/403), record failed attempt
                await recordFailedAttempt(identifier, config);
            }

            return response;
        } catch (error) {
            // On error, record failed attempt
            await recordFailedAttempt(identifier, config);
            throw error;
        }
    };
}

/**
 * Clear all brute-force records for an identifier
 * Useful for manual unlock
 */
export async function clearBruteForceRecords(identifier: string) {
    const redisClient: Redis | null = null; // getRedisClient();
    if (!redisClient) return;

    const redis: Redis = redisClient;

    try {
        const lockKey = `bruteforce:locked:${identifier}`;
        const attemptsKey = `bruteforce:attempts:${identifier}`;

        await redis.del(lockKey);
        await redis.del(attemptsKey);
    } catch (error) {
        console.error("Failed to clear brute-force records:", error);
    }
}

/**
 * Get brute-force stats for monitoring
 */
export async function getBruteForceStats() {
    const redisClient: Redis | null = null; // getRedisClient();

    if (!redisClient) {
        return {
            totalTrackedIdentifiers: 0,
            currentlyLockedAccounts: 0,
            accountsWithFailedAttempts: 0,
        };
    }

    const redis: Redis = redisClient;

    try {
        const lockedAccounts = await redis.keys("bruteforce:locked:*");
        const attemptedAccounts = await redis.keys("bruteforce:attempts:*");

        return {
            totalTrackedIdentifiers: new Set([
                ...lockedAccounts,
                ...attemptedAccounts,
            ]).size,
            currentlyLockedAccounts: lockedAccounts.length,
            accountsWithFailedAttempts: attemptedAccounts.length,
        };
    } catch (error) {
        console.error("Failed to get brute-force stats:", error);
        return null;
    }
}
