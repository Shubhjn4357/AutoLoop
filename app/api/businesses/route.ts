import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(businesses.userId, userId)];

    if (category) {
      conditions.push(eq(businesses.category, category));
    }

    if (status) {
      conditions.push(eq(businesses.emailStatus, status));
    }

    console.log(`🔍 Fetching businesses for UserID: ${userId}`);
    console.log(`   Filters - Category: ${category}, Status: ${status}, Page: ${page}, Limit: ${limit}`);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(and(...conditions));

    console.log(`   Found ${count} total businesses matching criteria`);

    const totalPages = Math.ceil(count / limit);

    const results = await db
      .select()
      .from(businesses)
      .where(and(...conditions))
      .orderBy(businesses.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      businesses: results,
      page,
      limit,
      total: count,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    const [business] = await db
      .update(businesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Business ID required" },
        { status: 400 }
      );
    }

    await db.delete(businesses).where(eq(businesses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
