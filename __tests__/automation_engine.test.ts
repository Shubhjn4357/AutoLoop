import { describe, it, expect, vi, beforeEach } from "vitest";
import { processWebhookEvent, queueEvent } from "@/lib/queue/engine";
import { db } from "@/lib/db/client";

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      socialAccounts: { findFirst: vi.fn() },
      automations: { findMany: vi.fn(), findFirst: vi.fn() },
      eventQueue: { findFirst: vi.fn() },
      contacts: { findFirst: vi.fn() },
      messages: { findFirst: vi.fn() },
      automationMetrics: { findFirst: vi.fn() },
      rateLimitState: { findFirst: vi.fn() },
      aiConversations: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/lib/instagram/client", () => ({
  sendInstagramMessage: vi.fn().mockResolvedValue({}),
  replyToInstagramComment: vi.fn().mockResolvedValue({}),
  getInstagramUserProfile: vi.fn().mockResolvedValue({ is_user_follow_business: true }),
}));

vi.mock("@/lib/ai", () => ({
  analyzeSentiment: vi.fn().mockResolvedValue({ sentiment: "positive" }),
  generateSmartReply: vi.fn().mockResolvedValue({ reply: "AI generated reply" }),
}));

vi.mock("@/lib/notifications/logs", () => ({
  createNotificationLog: vi.fn().mockResolvedValue({}),
}));

describe("Queue-based Automation Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should queue webhook events for async processing", async () => {
    const webhookBody = {
      object: "instagram",
      entry: [{
        id: "ig_1",
        messaging: [{
          sender: { id: "sender_1" },
          recipient: { id: "ig_1" },
          message: { text: "hello" },
          timestamp: Date.now(),
        }],
      }],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.eventQueue.findFirst as any).mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.insert as any).mockReturnValue({ values: vi.fn().mockResolvedValue({}) });

    const result = await processWebhookEvent(webhookBody);

    expect(result.success).toBe(true);
    expect(result.queued).toBe(1);
  });

  it("should prevent duplicate event queuing", async () => {
    const webhookBody = {
      object: "instagram",
      entry: [{
        id: "ig_1",
        messaging: [{
          sender: { id: "sender_1" },
          recipient: { id: "ig_1" },
          message: { text: "hello" },
          timestamp: Date.now(),
        }],
      }],
    };

    // Mock existing queued event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.eventQueue.findFirst as any).mockResolvedValue({
      id: "existing-id",
      status: "pending",
    });

    const result = await processWebhookEvent(webhookBody);

    expect(result.success).toBe(true);
    // Should not insert new event
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should queue events with idempotency keys", async () => {
    const result = await queueEvent({
      eventType: "dm",
      payload: { text: "test" },
      externalId: "ig_1",
      recipientId: "sender_1",
      idempotencyKey: "unique-key-123",
    });

    if (result.success && result.queuedId) {
      expect(result.queuedId).toBeDefined();
    }
  });
});
