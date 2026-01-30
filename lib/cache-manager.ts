import { redis } from "@/lib/redis";
import { Logger } from "@/lib/logger";

/**
 * Get cached data or fetch fresh data
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns Cached or fresh data
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 300
): Promise<T> {
    if (!redis) {
        return fetcher(); // No Redis, always fetch fresh
    }

    try {
        const cached = await redis.get(key);
        if (cached) {
            Logger.debug("Cache hit", { key, ttl });
            return JSON.parse(cached);
        }

        Logger.debug("Cache miss", { key });
        const data = await fetcher();
        await redis.setex(key, ttl, JSON.stringify(data));
        return data;
    } catch (error) {
        Logger.warn("Cache error, falling back to fetcher", {
            key,
            error: error instanceof Error ? error.message : String(error),
        });
        return fetcher(); // Fallback to fetcher on error
    }
}

/**
 * Invalidate cache keys matching a pattern
 * @param pattern - Pattern to match (e.g., "businesses:user_123:*")
 */
export async function invalidateCache(pattern: string) {
    if (!redis) return;

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            Logger.debug("Cache invalidated", { pattern, count: keys.length });
        }
    } catch (error) {
        Logger.warn("Cache invalidation error", {
            pattern,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Set cache value directly
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in seconds
 */
export async function setCache<T>(
    key: string,
    data: T,
    ttl = 300
): Promise<void> {
    if (!redis) return;

    try {
        await redis.setex(key, ttl, JSON.stringify(data));
        Logger.debug("Cache set", { key, ttl });
    } catch (error) {
        Logger.warn("Cache set error", {
            key,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Get cache value directly
 * @param key - Cache key
 * @returns Cached data or null
 */
export async function getCache<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        Logger.warn("Cache get error", {
            key,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

/**
 * Delete specific cache key
 * @param key - Cache key to delete
 */
export async function deleteCache(key: string): Promise<void> {
    if (!redis) return;

    try {
        await redis.del(key);
        Logger.debug("Cache deleted", { key });
    } catch (error) {
        Logger.warn("Cache delete error", {
            key,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Cache helpers for specific data types
 */
export const CacheKeys = {
    // Businesses
    businesses: (userId: string) => `businesses:${userId}`,
    businessesByCategory: (userId: string, category: string) =>
        `businesses:${userId}:${category}`,
    businessDetail: (businessId: string) => `business:${businessId}`,

    // Workflows
    workflows: (userId: string) => `workflows:${userId}`,
    workflowDetail: (workflowId: string) => `workflow:${workflowId}`,
    workflowExecutions: (workflowId: string) => `executions:${workflowId}`,

    // Templates
    templates: (userId: string) => `templates:${userId}`,
    templateDetail: (templateId: string) => `template:${templateId}`,

    // Analytics
    analytics: (userId: string, period = "day") =>
        `analytics:${userId}:${period}`,
    userStats: (userId: string) => `stats:${userId}`,

    // User data
    userProfile: (userId: string) => `user:${userId}`,
    userSettings: (userId: string) => `settings:${userId}`,

    // General
    search: (userId: string, query: string) =>
        `search:${userId}:${query.toLowerCase()}`,
};

/**
 * Invalidate cache patterns for common scenarios
 */
export const InvalidatePatterns = {
    // When business is updated/created/deleted
    businessesUpdated: (userId: string) => `businesses:${userId}:*`,
    // When workflow is updated
    workflowsUpdated: (userId: string) => `workflows:${userId}*`,
    // When template is updated
    templatesUpdated: (userId: string) => `templates:${userId}*`,
    // When user settings change
    userSettingsUpdated: (userId: string) => `settings:${userId}`,
    // When analytics should refresh
    analyticsUpdated: (userId: string) => `analytics:${userId}:*`,
    // Clear all cache for user
    allUserCache: (userId: string) => `*:${userId}*`,
};

/**
 * Cache with automatic invalidation after operation
 * @param key - Cache key
 * @param fetcher - Fetch function
 * @param invalidateAfter - Patterns to invalidate after fetch
 * @param ttl - Time to live in seconds
 */
export async function getCachedWithInvalidation<T>(
    key: string,
    fetcher: () => Promise<T>,
    invalidateAfter: string[] = [],
    ttl = 300
): Promise<T> {
    const data = await getCached(key, fetcher, ttl);

    // Invalidate related caches
    for (const pattern of invalidateAfter) {
        await invalidateCache(pattern);
    }

    return data;
}
