const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "https://shubhjn-autoloop.hf.space";

export async function serverFetch(path: string, userId: string, options: RequestInit = {}) {
  const url = new URL(`${SERVER_URL}${path}`);
  
  // Add userId to query params for GET requests
  if (!options.method || options.method.toUpperCase() === "GET") {
    url.searchParams.set("userId", userId);
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // Inject userId into body for POST/PUT/DELETE if it's JSON
  let body = options.body;
  if (options.body && typeof options.body === "string" && headers.get("Content-Type") === "application/json") {
    try {
      const parsed = JSON.parse(options.body);
      parsed.userId = userId;
      body = JSON.stringify(parsed);
    } catch (e) {
      // Not JSON or parse error, leave as is
    }
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers,
    body,
  });

  return res;
}
