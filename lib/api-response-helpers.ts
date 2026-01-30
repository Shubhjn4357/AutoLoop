/**
 * Standardized API Response Helper
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from "next/server";

export interface StandardAPIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}

/**
 * Success response
 */
export function apiSuccess<T>(data: T, message?: string): NextResponse {
    return NextResponse.json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    } as StandardAPIResponse<T>);
}

/**
 * Error response
 */
export function apiError(
    error: string,
    status: number = 400,
    data?: unknown
): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error,
            data,
            timestamp: new Date().toISOString(),
        } as StandardAPIResponse,
        { status }
    );
}

/**
 * Validation error response
 */
export function apiValidationError(errors: Record<string, string>): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: "Validation failed",
            data: { errors },
            timestamp: new Date().toISOString(),
        } as StandardAPIResponse,
        { status: 422 }
    );
}

/**
 * Unauthorized response
 */
export function apiUnauthorized(message = "Unauthorized"): NextResponse {
    return apiError(message, 401);
}

/**
 * Not found response
 */
export function apiNotFound(resource = "Resource"): NextResponse {
    return apiError(`${resource} not found`, 404);
}

/**
 * Internal server error response
 */
export function apiServerError(message = "Internal server error"): NextResponse {
    return apiError(message, 500);
}

/**
 * Rate limit error response
 */
export function apiRateLimitError(
    message = "Rate limit exceeded. Please try again later."
): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
        } as StandardAPIResponse,
        { status: 429 }
    );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(
    handler: (req: Request, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
    return async (
        req: Request,
        context?: { params: Record<string, string> }
    ): Promise<NextResponse> => {
        try {
            return await handler(req, context);
        } catch (error) {
            console.error("API Error:", error);

            if (error instanceof Error) {
                return apiServerError(error.message);
            }

            return apiServerError();
        }
    };
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(
    req: Request,
    schema?: { parse: (data: unknown) => T }
): Promise<{ data?: T; error?: NextResponse }> {
    try {
        const body = await req.json();

        if (schema) {
            try {
                const validated = schema.parse(body);
                return { data: validated };
            } catch (validationError) {
                if (validationError && typeof validationError === "object" && "errors" in validationError) {
                    const errors = validationError.errors as Array<{ path: string[]; message: string }>;
                    const errorMap = errors.reduce((acc, err) => {
                        acc[err.path.join(".")] = err.message;
                        return acc;
                    }, {} as Record<string, string>);
                    return { error: apiValidationError(errorMap) };
                }
                return { error: apiError("Validation failed", 422) };
            }
        }

        return { data: body as T };
    } catch {
        return { error: apiError("Invalid JSON body", 400) };
    }
}
