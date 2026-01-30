import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger";

/**
 * API request context for logging and debugging
 */
export interface ApiContext {
    userId?: string;
    ip?: string;
    method: string;
    path: string;
    requestId?: string;
}

/**
 * Wrapper function for API routes with consistent error handling
 * Automatically logs requests, errors, and timing information
 *
 * @param handler - The actual API route handler function
 * @param req - NextRequest object
 * @param context - Optional API context (auto-populated if not provided)
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   return withErrorHandling(async (req, context) => {
 *     const session = await auth();
 *     if (!session?.user) {
 *       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *     }
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   }, req);
 * }
 */
export async function withErrorHandling(
    handler: (req: NextRequest, context: ApiContext) => Promise<Response>,
    req: NextRequest,
    context?: Partial<ApiContext>
): Promise<Response> {
    const startTime = performance.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    const apiContext: ApiContext = {
        method: req.method,
        path: new URL(req.url).pathname,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
        requestId,
        ...context,
    };

    try {
        const response = await handler(req, apiContext);
        const duration = Math.round(performance.now() - startTime);

        // Log successful requests (but not 4xx errors)
        if (response.status < 400) {
            Logger.info("API Request Success", {
                ...apiContext,
                duration,
                status: response.status,
            });
        }

        // Add request ID to response headers for tracing
        const newResponse = new NextResponse(response.body, response);
        newResponse.headers.set("X-Request-Id", requestId);
        return newResponse;
    } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        // Log error
        Logger.error("API Request Error", {
            ...apiContext,
            duration,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });

        // Return consistent error response
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                code: "INTERNAL_SERVER_ERROR",
                requestId,
            },
            {
                status: 500,
                headers: {
                    "X-Request-Id": requestId,
                },
            }
        );
    }
}

/**
 * Wrapper for Server Actions with error handling
 * @param action - Server action function
 * @param context - Action context (userId, etc.)
 *
 * @example
 * export async function createBusiness(formData: FormData) {
 *   return withServerActionErrorHandling(async () => {
 *     const body = Object.fromEntries(formData);
 *     // Process logic
 *     return { success: true, data };
 *   }, { userId: session.user.id });
 * }
 */
export async function withServerActionErrorHandling<T>(
    action: () => Promise<T>,
    context?: Partial<ApiContext>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    const startTime = performance.now();

    try {
        const result = await action();
        const duration = Math.round(performance.now() - startTime);

        Logger.info("Server Action Success", {
            ...context,
            duration,
        });

        return { success: true, data: result };
    } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        Logger.error("Server Action Error", {
            ...context,
            duration,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}

/**
 * Check if request should be rejected for common reasons
 * @param req - NextRequest to check
 * @returns Error response if request should be rejected, null otherwise
 */
export function checkRequestValidity(req: NextRequest): NextResponse | null {
    // Check for required headers
    const contentType = req.headers.get("content-type");

    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
        if (!contentType) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Content-Type header is required",
                    code: "MISSING_CONTENT_TYPE",
                },
                { status: 400 }
            );
        }
    }

    return null;
}
