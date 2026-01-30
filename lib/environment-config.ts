/**
 * Environment Configuration & Validation
 * Ensures all required environment variables are set and valid
 */

import { z } from "zod";

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

    // OAuth Providers (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_ID: z.string().optional(),
    GITHUB_SECRET: z.string().optional(),

    // Redis
    REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),

    // API Keys
    SENDGRID_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),

    // Environment
    NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Feature Flags
    ENABLE_ANALYTICS: z.string().transform((v) => v === "true").default("true"),
    ENABLE_EMAIL_NOTIFICATIONS: z.string().transform((v) => v === "true").default("true"),
    ENABLE_TWO_FACTOR: z.string().transform((v) => v === "true").default("false"),
});

type Environment = z.infer<typeof envSchema>;

let validatedEnv: Environment | null = null;

/**
 * Validate environment variables on startup
 */
export function validateEnvironment(): Environment {
    if (validatedEnv) {
        return validatedEnv;
    }

    try {
        validatedEnv = envSchema.parse(process.env);
        console.info("✅ Environment variables validated successfully");
        return validatedEnv;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");

            console.error("❌ Environment validation failed:");
            console.error(missingVars);

            throw new Error("Invalid environment variables. Check logs for details.");
        }
        throw error;
    }
}

/**
 * Get environment variable with type safety
 */
export function getEnv(): Environment {
    if (!validatedEnv) {
        validateEnvironment();
    }
    return validatedEnv!;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
    const env = getEnv();
    const value = (env as Record<string, any>)[featureName];
    // Validate on import
    if (typeof window === "undefined") {
        try {
            validateEnvironment();
        } catch (error) {
            // Only throw in production
            if (process.env.NODE_ENV === "production") {
                throw error;
            }
        }
    }
    return value === true || value === "true";
}
