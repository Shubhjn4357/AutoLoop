import { lookup } from 'node:dns/promises';

/**
 * Enhanced fetch with retries, timeouts, and DNS diagnostics.
 * Specifically designed to handle Hugging Face egress limitations.
 */
export async function fetchWithRetry(
  url: string, 
  options: any = {}, 
  retries = 7, 
  backoff = 3000
): Promise<any> {
  const isServer = typeof window === 'undefined';

  for (let i = 0; i < retries; i++) {
    try {
      if (isServer) console.log(`[fetchWithRetry] Attempt ${i + 1}: ${url.split('?')[0]}...`);
      
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(options.timeout || 30000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options.headers
        }
      });

      if (res.ok) {
        // Automatically parse JSON for convenience in shared utilities
        const text = await res.text();
        if (!text) return {};
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }

      const errorBody = await res.clone().text().catch(() => "No error body");
      console.warn(`[fetchWithRetry] Status ${res.status}: ${errorBody.substring(0, 150)}`);

      if (i < retries - 1 && (res.status === 429 || res.status >= 500)) {
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
        continue;
      }
      
      // If we got an error but it's not retryable (e.g. 400), throw it
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API Error ${res.status}`);
      
    } catch (err: any) {
      if (isServer && i > 0) {
        try {
          const host = new URL(url).hostname;
          const addr = await lookup(host);
          console.log(`[fetchWithRetry] DNS Diagnostic for ${host}: ${addr.address} (${addr.family})`);
        } catch (dnsErr: any) {
          console.warn(`[fetchWithRetry] DNS Diagnostic Failed: ${dnsErr.message}`);
        }
      }

      if (i === retries - 1) throw err;
      
      const isNetworkError = 
        err.name === 'AbortError' || 
        err.name === 'TimeoutError' || 
        err.message.includes('fetch failed') || 
        err.message.includes('timeout') ||
        err.code === 'UND_ERR_CONNECT_TIMEOUT';

      if (isNetworkError) {
        if (isServer) console.warn(`[fetchWithRetry] Network Error: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
        continue;
      }

      throw err;
    }
  }
}
