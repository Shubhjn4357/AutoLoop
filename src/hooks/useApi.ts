/**
 * Helper hooks and utilities for making API requests
 */

export function useApi() {
  const fetcher = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }

    return res.json();
  };

  return { fetcher };
}
