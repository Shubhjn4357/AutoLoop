/**
 * Business Server Actions
 * Handles all business-related data operations
 */

"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";

export async function getBusinesses(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  emailStatus?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { limit = 20, offset = 0, search, emailStatus } = options || {};

  let query = db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id))
    .$dynamic();

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        ilike(businesses.name, `%${search}%`),
        ilike(businesses.email, `%${search}%`),
        ilike(businesses.website, `%${search}%`)
      )
    );
  }

  // Apply email status filter
  if (emailStatus && emailStatus !== "all") {
    query = query.where(eq(businesses.emailStatus, emailStatus));
  }

  const results = await query
    .orderBy(desc(businesses.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getBusinessById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const business = await db.query.businesses.findFirst({
    where: and(
      eq(businesses.id, id),
      eq(businesses.userId, session.user.id)
    ),
  });

  if (!business) {
    throw new Error("Business not found");
  }

  return business;
}

export async function updateBusinessStatus(id: string, emailStatus: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [updated] = await db
    .update(businesses)
    .set({ emailStatus, updatedAt: new Date() })
    .where(
      and(
        eq(businesses.id, id),
        eq(businesses.userId, session.user.id)
      )
    )
    .returning();

  return updated;
}

export async function deleteBusiness(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(businesses)
    .where(
      and(
        eq(businesses.id, id),
        eq(businesses.userId, session.user.id)
      )
    );

  return { success: true };
}

export async function getBusinessStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id));

  const total = allBusinesses.length;
  const pending = allBusinesses.filter(b => b.emailStatus === "pending").length;
  const sent = allBusinesses.filter(b => b.emailStatus === "sent").length;
  const opened = allBusinesses.filter(b => b.emailStatus === "opened").length;
  const clicked = allBusinesses.filter(b => b.emailStatus === "clicked").length;

  return {
    total,
    pending,
    sent,
    opened,
    clicked,
    openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0",
    clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : "0.0",
  };
}
