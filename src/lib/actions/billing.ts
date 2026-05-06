"use server";

import { stripe, PLANS } from "@/lib/stripe";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createCheckoutSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!dbUser) throw new Error("User not found");

  const stripeSession = await stripe.checkout.sessions.create({
    customer: dbUser.stripeCustomerId || undefined,
    customer_email: dbUser.stripeCustomerId ? undefined : dbUser.email || undefined,
    line_items: [
      {
        price: PLANS.PRO.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    client_reference_id: session.user.id,
  });

  if (stripeSession.url) {
    redirect(stripeSession.url);
  }
}

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!dbUser?.stripeCustomerId) throw new Error("No stripe customer found");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  if (portalSession.url) {
    redirect(portalSession.url);
  }
}
