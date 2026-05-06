import Stripe from "stripe";

let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
      _stripe = new Stripe(apiKey, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: "2026-04-22.dahlia" as any,
        typescript: true,
        httpClient: Stripe.createFetchHttpClient(),
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_stripe as any)[prop];
  },
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: "",
    maxAccounts: 1,
    aiEnabled: false,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_123",
    maxAccounts: 10,
    aiEnabled: true,
  },
};
