import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia", // Latest version for this environment
  typescript: true,
  httpClient: Stripe.createFetchHttpClient(), // Important for Cloudflare/Edge
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
