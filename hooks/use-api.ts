'use client'
import { useState, useCallback } from "react";

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  request: <R = T>(
    url: string,
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    body?: unknown,
    options?: ApiOptions
  ) => Promise<R | null>;
  get: <R = T>(url: string, options?: ApiOptions) => Promise<R | null>;
  post: <R = T>(url: string, body?: unknown, options?: ApiOptions) => Promise<R | null>;
  put: <R = T>(url: string, body?: unknown, options?: ApiOptions) => Promise<R | null>;
  del: <R = T>(url: string, body?: unknown, options?: ApiOptions) => Promise<R | null>;
  patch: <R = T>(url: string, body?: unknown, options?: ApiOptions) => Promise<R | null>;
}

export function useApi<T = unknown>(): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const request = useCallback(
    async <R = T>(
      url: string,
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
      body?: unknown,
      options?: ApiOptions
    ): Promise<R | null> => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...options?.headers,
        };

        const config: RequestInit = {
          ...options,
          method,
          headers,
        };

        if (body) {
          config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
          let errorMessage = "An error occurred";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || response.statusText;
          } catch {
            errorMessage = response.statusText;
          }
          throw new Error(errorMessage);
        }

        try {
          // Check if response is empty
          const text = await response.text();
          const result = text ? JSON.parse(text) : null;
          // We can't easily type assert generic R to T to set state, so we might need to skip setData or cast rigorously
          // For now, let's keep setData best-effort if R extends T, usually users rely on return value for one-offs
          // safely ignore setData type mismatch or cast to any
          setData(result as unknown as T);
          return result as R;
        } catch {
            // If strictly typed as T, this might be an issue if T isn't void/null compliant
            // but for generic generic use usage, returning null on empty body is often handled
            setData(null);
            return null;
        }

      } catch (err: unknown) {
        let message = "Something went wrong";
        if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const get = useCallback(<R = T>(url: string, options?: ApiOptions) => request<R>(url, "GET", undefined, options), [request]);
  const post = useCallback(<R = T>(url: string, body?: unknown, options?: ApiOptions) => request<R>(url, "POST", body, options), [request]);
  const put = useCallback(<R = T>(url: string, body?: unknown, options?: ApiOptions) => request<R>(url, "PUT", body, options), [request]);
  const del = useCallback(<R = T>(url: string, body?: unknown, options?: ApiOptions) => request<R>(url, "DELETE", body, options), [request]);
  const patch = useCallback(<R = T>(url: string, body?: unknown, options?: ApiOptions) => request<R>(url, "PATCH", body, options), [request]);

  return {
    data,
    error,
    loading,
    request,
    get,
    post,
    put,
    del,
    patch
  };
}
