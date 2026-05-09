/**
 * Robust fetch utility with retries and browser-like headers to bypass bot filters.
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  backoff = 2000
) {
  const standardHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  let lastError: any = null;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...standardHeaders,
          ...options.headers,
        },
        // node-fetch / undici support signal
        signal: options.signal || AbortSignal.timeout(30000),
      });

      // If it's a 4xx/5xx that isn't worth retrying (like 401/403/404), return it
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        return res;
      }

      if (res.ok) return res;

      lastError = new Error(`Fetch failed with status ${res.status}`);
    } catch (err: any) {
      lastError = err;
    }

    if (i < retries - 1) {
      const delay = backoff * Math.pow(2, i);
      console.warn(`[Shared Fetch] Attempt ${i + 1} failed. Retrying in ${delay}ms... Error: ${lastError.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}
