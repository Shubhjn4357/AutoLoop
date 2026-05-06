import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed":
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await db.update(users)
        .set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId: subscription.items.data[0].price.id,
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.id, session.client_reference_id as string));
      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await db.update(users)
        .set({
          stripePriceId: session.items.data[0].price.id,
          subscriptionStatus: session.status,
        })
        .where(eq(users.stripeSubscriptionId, session.id as string));
      break;
  }

  return new NextResponse(null, { status: 200 });
}
