/**
 * Core API hook for consistent fetching and state management
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface UseApiOptions {
  showErrorToast?: boolean;
}

export function useApi<T = unknown>(options: UseApiOptions = { showErrorToast: true }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(async (
    url: string, 
    fetchOptions?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions?.headers,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `API Error: ${res.statusText}`);
      }

      setData(result);
      return result;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setError(errorInstance);
      if (options.showErrorToast) {
        toast.error(errorInstance.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.showErrorToast]);

  return { 
    data, 
    loading, 
    error, 
    request,
    setData
  };
}
