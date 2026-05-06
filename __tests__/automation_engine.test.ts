import { describe, it, expect, vi, beforeEach } from "vitest";
import { processInstagramMessage } from "@/lib/automation/engine";
import { db } from "@/lib/db/client";
import { automationState } from "@/lib/db/schema";

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      socialAccounts: { findFirst: vi.fn() },
      automations: { findMany: vi.fn(), findFirst: vi.fn() },
      automationState: { findFirst: vi.fn() },
      contacts: { findFirst: vi.fn() },
      messages: { findFirst: vi.fn() },
      automationMetrics: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
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
  categorizeLead: vi.fn().mockResolvedValue("interested"),
}));

describe("Automation Engine - Stateful Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start a new flow and hit a WAIT node", async () => {
    const mockAccount = { userId: "user_1", accessToken: "tok", externalId: "ig_1" };
    const mockAutomation = {
      id: "auto_1",
      name: "Test Flow",
      type: "dm",
      triggerType: "dm",
      isActive: true,
      conditionOperator: "contains",
      condition: "hello",
      flowJson: JSON.stringify([
        { id: "node_1", type: "text", config: { text: "Hi there!" } },
        { id: "node_2", type: "wait" }
      ]),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.socialAccounts.findFirst as any).mockResolvedValue(mockAccount);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.automations.findMany as any).mockResolvedValue([mockAutomation]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.automationState.findFirst as any).mockResolvedValue(null);

    await processInstagramMessage({
      externalId: "ig_1",
      senderId: "sender_1",
      text: "hello",
    });

    // Should have saved state at node_2
    expect(db.insert).toHaveBeenCalledWith(automationState);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
      currentNodeId: "node_2",
      automationId: "auto_1",
    }));
  });

  it("should resume a flow from a WAIT node", async () => {
    const mockAccount = { userId: "user_1", accessToken: "tok", externalId: "ig_1" };
    const mockState = {
      id: "state_1",
      automationId: "auto_1",
      currentNodeId: "node_2",
      userId: "user_1",
      externalId: "ig_1",
      recipientId: "sender_1",
    };
    const mockAutomation = {
      id: "auto_1",
      flowJson: JSON.stringify([
        { id: "node_1", type: "text", config: { text: "Hi!" } },
        { id: "node_2", type: "wait" },
        { id: "node_3", type: "text", config: { text: "Moving on..." } }
      ]),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.socialAccounts.findFirst as any).mockResolvedValue(mockAccount);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.automationState.findFirst as any).mockResolvedValue(mockState);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query.automations.findFirst as any).mockResolvedValue(mockAutomation);

    await processInstagramMessage({
      externalId: "ig_1",
      senderId: "sender_1",
      text: "next",
    });

    // Should have deleted state after finishing
    expect(db.delete).toHaveBeenCalledWith(automationState);
  });
});
