"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createCheckoutSession() {
  throw new Error("Billing is currently disabled for maintenance.");
}

export async function createPortalSession() {
  throw new Error("Billing is currently disabled for maintenance.");
}
