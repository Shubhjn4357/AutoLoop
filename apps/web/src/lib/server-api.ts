/**
 * Server-side utility to call the Hono automation server.
 * Used in Next.js Server Components.
 */

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:7860';
const SERVER_API_KEY = process.env.SERVER_API_KEY;

export async function callServer(path: string, userId: string, options: RequestInit = {}) {
  if (!SERVER_API_KEY) {
    throw new Error('SERVER_API_KEY is not configured');
  }

  const url = new URL(path, SERVER_BASE_URL);
  url.searchParams.set('userId', userId);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'x-server-api-key': SERVER_API_KEY || '',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Server error: ${res.statusText}`);
  }

  return res.json();
}
