/**
 * Social Media Server Actions
 * Handles all social media automation operations
 */

"use server";

import { db } from "@/db";
import { socialAutomations, connectedAccounts, socialPosts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";

export async function getSocialAutomations() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const automations = await db.query.socialAutomations.findMany({
    where: eq(socialAutomations.userId, session.user.id),
    with: {
      account: true,
    },
    orderBy: desc(socialAutomations.createdAt),
  });

  return automations;
}

export async function getConnectedAccounts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const accounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.userId, session.user.id),
    orderBy: desc(connectedAccounts.createdAt),
  });

  return accounts;
}

export async function getSocialPosts(limit = 20, offset = 0) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const posts = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.userId, session.user.id))
    .orderBy(desc(socialPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  return posts;
}

export async function toggleAutomation(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [updated] = await db
    .update(socialAutomations)
    .set({ isActive, updatedAt: new Date() })
    .where(
      and(
        eq(socialAutomations.id, id),
        eq(socialAutomations.userId, session.user.id)
      )
    )
    .returning();

  return updated;
}

export async function deleteAutomation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(socialAutomations)
    .where(
      and(
        eq(socialAutomations.id, id),
        eq(socialAutomations.userId, session.user.id)
      )
    );

  return { success: true };
}

export async function getSocialStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [accounts, automations, posts] = await Promise.all([
    db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.userId, session.user.id),
    }),
    db.query.socialAutomations.findMany({
      where: eq(socialAutomations.userId, session.user.id),
    }),
    db.query.socialPosts.findMany({
      where: eq(socialPosts.userId, session.user.id),
    }),
  ]);

  return {
    connectedAccounts: accounts.length,
    activeAutomations: automations.filter(a => a.isActive).length,
    totalAutomations: automations.length,
    totalPosts: posts.length,
    platformBreakdown: accounts.reduce((acc, account) => {
      acc[account.provider] = (acc[account.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
