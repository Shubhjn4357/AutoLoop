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
