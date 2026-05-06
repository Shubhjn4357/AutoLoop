import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhook/stripe/route";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db/client";

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/client", () => {
  const mockDb = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  };
  return { db: mockDb };
});

describe("Stripe Webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle checkout.session.completed", async () => {
    const mockSession = {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_123",
          subscription: "sub_123",
          client_reference_id: "user_123",
        },
      },
    };

    const mockSubscription = {
      status: "active",
      items: {
        data: [{ price: { id: "price_123" } }],
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (stripe.subscriptions.retrieve as any).mockResolvedValue(mockSubscription);

    const req = new Request("http://localhost/api/webhook/stripe", {
      method: "POST",
      headers: { "stripe-signature": "test-sig" },
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db as any).update).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db as any).set).toHaveBeenCalledWith(expect.objectContaining({
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
    }));
  });
});
