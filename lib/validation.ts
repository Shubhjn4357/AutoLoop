import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Validate request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data or errors
 */
export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data);

    if (!result.success) {
        return { success: false, errors: result.error };
    }

    return { success: true, data: result.data };
}

/**
 * Return a standardized validation error response
 * @param errors - Zod validation errors
 * @returns NextResponse with 400 status and error details
 */
export function validationErrorResponse(errors: z.ZodError) {
    return NextResponse.json(
        {
            success: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: errors.flatten(),
        },
        { status: 400 }
    );
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
    // Business validation
    createBusiness: z.object({
        name: z.string().min(1, "Business name is required"),
        email: z.string().email("Valid email is required").optional(),
        phone: z.string().optional(),
        website: z.string().url("Valid URL is required").optional(),
        address: z.string().optional(),
        category: z.string().min(1, "Category is required"),
    }),

    // Workflow validation
    createWorkflow: z.object({
        name: z.string().min(1, "Workflow name is required"),
        description: z.string().optional(),
        nodes: z.array(z.unknown()).optional(),
        edges: z.array(z.unknown()).optional(),
    }),

    // Email template validation
    createTemplate: z.object({
        name: z.string().min(1, "Template name is required"),
        subject: z.string().min(1, "Subject is required"),
        body: z.string().min(1, "Email body is required"),
        category: z.string().optional(),
    }),

    // Scraping job validation
    startScraping: z.object({
        targetBusinessType: z.string().min(1, "Business type is required"),
        keywords: z.array(z.string()).optional(),
        location: z.string().min(1, "Location is required"),
        sources: z.array(z.string()).optional(),
    }),

    // Pagination validation
    pagination: z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
    }),

    // Workflow execution validation
    executeWorkflow: z.object({
        workflowId: z.string().min(1, "Workflow ID is required"),
        businessId: z.string().optional(),
        variables: z.record(z.unknown()).optional(),
    }),
};

/**
 * Middleware helper to validate request body
 * Usage:
 * const body = await req.json();
 * const validation = validateRequest(ValidationSchemas.createBusiness, body);
 * if (!validation.success) return validationErrorResponse(validation.errors);
 * const { name, email } = validation.data;
 */
export async function validateRequestBody<T>(
    req: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
    try {
        const body = await req.json();
        const validation = validateRequest(schema, body);

        if (!validation.success) {
            return {
                success: false,
                response: validationErrorResponse(validation.errors),
            };
        }

        return { success: true, data: validation.data };
    } catch (error) {
        return {
            success: false,
            response: NextResponse.json(
                {
                    success: false,
                    error: "Invalid JSON in request body",
                    code: "INVALID_JSON",
                },
                { status: 400 }
            ),
        };
    }
}
