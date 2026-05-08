import type { Context, Next } from "hono";

function isPublicApiRoute(method: string, path: string) {
  if (path === "/api/webhook/instagram") return true;
  if (method === "GET" && path === "/api/instagram/connect") return true;
  if (method === "GET" && path === "/api/instagram/callback") return true;
  if (method === "POST" && path === "/api/user/delete") return true;
  if (method === "GET" && path === "/api/user/delete") return true;

  return false;
}

export async function apiAuth(c: Context, next: Next) {
  if (isPublicApiRoute(c.req.method, c.req.path)) {
    return next();
  }

  if (c.req.method === "POST" && c.req.path === "/api/automation/followups") {
    const cronSecret = process.env.AUTOMATION_CRON_SECRET;
    const providedCronSecret = c.req
      .header("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (cronSecret && providedCronSecret === cronSecret) {
      return next();
    }
  }

  const expectedKey = process.env.SERVER_API_KEY;
  if (!expectedKey) {
    if (process.env.NODE_ENV === "production") {
      return c.json({ error: "SERVER_API_KEY is not configured" }, 500);
    }

    return next();
  }

  const providedKey =
    c.req.header("x-server-api-key") ??
    c.req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedKey !== expectedKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
}
