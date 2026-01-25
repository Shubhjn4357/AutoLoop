import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses, scrapingJobs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email)
    });

    if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all businesses for the user
    await db.delete(businesses).where(eq(businesses.userId, currentUser.id));
    
    // Delete all scraping jobs for the user
    await db.delete(scrapingJobs).where(eq(scrapingJobs.userId, currentUser.id));

    return NextResponse.json({ success: true, message: "All scraped data deleted successfully" });
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
