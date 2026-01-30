/**
 * Custom React Hooks for Data Fetching
 * Provides reusable hooks for common data operations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { get, post, put, del, APIError } from "@/lib/api-client";

export interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for GET requests
 */
export function useQuery<T>(
  url: string | null,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, refetchOnMount = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await get<T>(url);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError("Failed to fetch data", 500);
      setError(apiError);
      onError?.(apiError);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, onSuccess, onError]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: APIError | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: APIError, variables: TVariables) => void;
  }
): UseMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        options?.onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError("Mutation failed", 500);
        setError(apiError);
        options?.onError?.(apiError, variables);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}

/**
 * Hook for POST mutations
 */
export function usePost<TData = unknown, TBody = unknown>(
  url: string,
  options?: Parameters<typeof useMutation>[1]
) {
  return useMutation<TData, TBody>(
    (body) => post<TData>(url, body),
    options
  );
}

/**
 * Hook for PUT mutations
 */
export function usePut<TData = unknown, TBody = unknown>(
  url: string,
  options?: Parameters<typeof useMutation>[1]
) {
  return useMutation<TData, TBody>(
    (body) => put<TData>(url, body),
    options
  );
}

/**
 * Hook for DELETE mutations
 */
export function useDelete<TData = unknown>(
  url: string,
  options?: Parameters<typeof useMutation>[1]
) {
  return useMutation<TData, void>(
    () => del<TData>(url),
    options
  );
}

/**
 * Hook for paginated data
 */
export interface UsePaginationOptions<T> {
  pageSize?: number;
  onSuccess?: (data: T[]) => void;
  onError?: (error: APIError) => void;
}

export interface UsePaginationResult<T> {
  data: T[];
  loading: boolean;
  error: APIError | null;
  page: number;
  hasMore: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function usePagination<T>(
  baseUrl: string,
  options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const { pageSize = 20, onSuccess, onError } = options;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
  const { data, loading, error, refetch } = useQuery<T[]>(url, {
    onSuccess: (result) => {
      setHasMore(result.length === pageSize);
      onSuccess?.(result);
    },
    onError,
  });

  const nextPage = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  return {
    data: data || [],
    loading,
    error,
    page,
    hasMore,
    nextPage,
    prevPage,
    setPage,
    refetch,
  };
}
