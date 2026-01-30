/**
 * API Client Helper Functions
 * Standardized API request handling with error management
 */

import { getErrorMessage } from "./utils";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make a typed API request with error handling
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || errorData.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData.code
      );
    }

    const data = await response.json();
    
    // Handle response that wraps data
    if (data.success === false) {
      throw new APIError(data.error || data.message || "Request failed", response.status);
    }
    
    return data.data !== undefined ? data.data : data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(getErrorMessage(error), 500);
  }
}

/**
 * GET request
 */
export async function get<T>(url: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(url, { ...options, method: "GET" });
}

/**
 * POST request
 */
export async function post<T>(
  url: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(
  url: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function patch<T>(
  url: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(url: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(url, { ...options, method: "DELETE" });
}

/**
 * Handle API response in components
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  return getErrorMessage(error);
}
