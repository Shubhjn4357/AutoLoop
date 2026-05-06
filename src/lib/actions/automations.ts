"use server";

import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleAutomation(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
  if (!automation || automation.userId !== session.user.id) throw new Error("Unauthorized");

  await db.update(automations)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(automations.id, id));

  revalidatePath("/dashboard/automations");
  return { success: true };
}

export async function deleteAutomation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const automation = await db.query.automations.findFirst({ where: eq(automations.id, id) });
  if (!automation || automation.userId !== session.user.id) throw new Error("Unauthorized");

  await db.delete(automations).where(eq(automations.id, id));

  revalidatePath("/dashboard/automations");
  return { success: true };
}
