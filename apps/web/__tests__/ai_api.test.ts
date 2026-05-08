import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/suggest-reply/route";
import { auth } from "@/lib/auth/config";

vi.mock("@/lib/ai", () => ({
  generateSmartReply: vi.fn().mockResolvedValue({ reply: "AI Suggestion" }),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      messages: {
        findMany: vi.fn().mockResolvedValue([
          { direction: "inbound", text: "Hello", timestamp: new Date() },
        ]),
      },
    },
  },
}));

describe("AI Suggest Reply API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthorized requests", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/ai/suggest-reply", {
      method: "POST",
      body: JSON.stringify({ senderId: "123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return a suggestion for authorized requests", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue({ user: { id: "user_123" } });
    const req = new Request("http://localhost/api/ai/suggest-reply", {
      method: "POST",
      body: JSON.stringify({ senderId: "123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestion).toBe("AI Suggestion");
  });
});
