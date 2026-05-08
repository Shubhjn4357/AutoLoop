const SERVER_PROXY_PREFIX = "/api/server";

function toProxyUrl(path: string) {
  const url = new URL(path, "http://autoloop.local");
  const upstreamPath = url.pathname.startsWith("/api/")
    ? url.pathname.slice("/api".length)
    : url.pathname;

  return `${SERVER_PROXY_PREFIX}${upstreamPath}${url.search}`;
}

export async function serverFetch(path: string, _userId: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(toProxyUrl(path), {
    ...options,
    headers,
  });

  return res;
}
