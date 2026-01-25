import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    // Fetch distinct categories
    const results = await db
      .selectDistinct({ category: businesses.category })
      .from(businesses)
      .where(eq(businesses.userId, userId))
      .orderBy(businesses.category);

    // Map to simple array of strings, filtering out nulls if any
    const categories = results
      .map((r) => r.category)
      .filter((c): c is string => !!c);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
