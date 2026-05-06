import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/webhook/instagram/route";
import crypto from "crypto";

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    after: vi.fn((cb) => cb()), // Execute callback immediately in tests
  };
});

vi.mock("@/lib/automation/engine", () => ({
  processInstagramMessage: vi.fn().mockResolvedValue({}),
  processInstagramComment: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIP: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Instagram Webhook API", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
    process.env.META_VERIFY_TOKEN = "test-token";
    process.env.META_APP_SECRET = "test-secret";
  });

  it("should verify webhook successfully (GET)", async () => {
    const req = new Request("http://localhost/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=test-token&hub.challenge=12345");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("12345");
  });

  it("should reject invalid verify token (GET)", async () => {
    const req = new Request("http://localhost/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=wrong-token");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("should accept valid signature (POST)", async () => {
    const payload = JSON.stringify({ object: "instagram", entry: [] });
    const hmac = crypto.createHmac("sha256", "test-secret");
    const signature = "sha256=" + hmac.update(payload).digest("hex");

    const req = new Request("http://localhost/api/webhook/instagram", {
      method: "POST",
      headers: { "x-hub-signature-256": signature },
      body: payload,
    });

    try {
      const res = await POST(req);
      if (res.status === 500) {
        console.log("500 Error body:", await res.text());
      }
      expect(res.status).toBe(200);
    } catch (err) {
      console.error("POST failed with error:", err);
      throw err;
    }
  });

  it("should reject invalid signature (POST)", async () => {
    const payload = JSON.stringify({ object: "instagram", entry: [] });
    const req = new Request("http://localhost/api/webhook/instagram", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=invalid" },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
