/**
 * Feature Flags System
 * Allows controlled rollout of features
 */

type FeatureFlagValue = boolean | "rollout" | "experiment";

interface FeatureFlagConfig {
    enabled: boolean;
    rolloutPercentage?: number; // 0-100
    users?: string[]; // Whitelist of user IDs
    excludeUsers?: string[]; // Blacklist of user IDs
    experimentGroup?: "control" | "treatment";
}

const FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
    // Core features
    emailNotifications: {
        enabled: true,
    },
    twoFactorAuth: {
        enabled: false,
        rolloutPercentage: 10, // 10% rollout
    },
    advancedAnalytics: {
        enabled: true,
        rolloutPercentage: 100,
    },
    aiPoweredSuggestions: {
        enabled: false,
        rolloutPercentage: 5,
    },
    customWhiteListing: {
        enabled: true,
        rolloutPercentage: 100,
    },

    // Experimental features
    newDashboardUI: {
        enabled: false,
        rolloutPercentage: 20,
        experimentGroup: "treatment",
    },
    betaWorkflowBuilder: {
        enabled: false,
        rolloutPercentage: 15,
        experimentGroup: "treatment",
    },

    // Admin features
    adminPanel: {
        enabled: true,
        users: ["admin@example.com"],
    },
};

/**
 * Check if feature is enabled for user
 */
export function isFeatureEnabled(
    featureName: string,
    userId?: string,
    userEmail?: string
): boolean {
    const flag = FEATURE_FLAGS[featureName];

    if (!flag || !flag.enabled) {
        return false;
    }

    // Check user whitelist
    if (flag.users && flag.users.length > 0) {
        const isWhitelisted = flag.users.includes(userEmail || userId || "");
        if (!isWhitelisted) {
            return false;
        }
    }

    // Check user blacklist
    if (flag.excludeUsers && flag.excludeUsers.length > 0) {
        const isBlacklisted = flag.excludeUsers.includes(userEmail || userId || "");
        if (isBlacklisted) {
            return false;
        }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        const hash = hashUserId(userId || userEmail || "");
        return (hash % 100) < flag.rolloutPercentage;
    }

    return true;
}

/**
 * Get experiment group for A/B testing
 */
export function getExperimentGroup(
    featureName: string,
    userId?: string
): "control" | "treatment" | null {
    const flag = FEATURE_FLAGS[featureName];

    if (!flag || !flag.experimentGroup) {
        return null;
    }

    // Use consistent hashing to assign user to group
    const hash = hashUserId(userId || "");
    return hash % 2 === 0 ? "control" : "treatment";
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(userId?: string): string[] {
    return Object.keys(FEATURE_FLAGS).filter((featureName) =>
        isFeatureEnabled(featureName, userId)
    );
}

/**
 * Simple hash function for consistent user bucketing
 */
function hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Update feature flag (admin only)
 */
export function updateFeatureFlag(
    featureName: string,
    config: Partial<FeatureFlagConfig>
): void {
    if (FEATURE_FLAGS[featureName]) {
        FEATURE_FLAGS[featureName] = {
            ...FEATURE_FLAGS[featureName],
            ...config,
        };
    } else {
        FEATURE_FLAGS[featureName] = config as FeatureFlagConfig;
    }
}

/**
 * Get all feature flags (admin only)
 */
export function getAllFeatureFlags(): Record<string, FeatureFlagConfig> {
    return { ...FEATURE_FLAGS };
}

/**
 * Reset feature flags to defaults (for testing)
 */
export function resetFeatureFlags(): void {
    Object.keys(FEATURE_FLAGS).forEach((key) => {
        delete FEATURE_FLAGS[key];
    });

    // Restore defaults
    Object.assign(FEATURE_FLAGS, {
        emailNotifications: { enabled: true },
        twoFactorAuth: { enabled: false, rolloutPercentage: 10 },
        advancedAnalytics: { enabled: true, rolloutPercentage: 100 },
    });
}
