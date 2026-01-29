import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQueueStats } from "@/lib/queue";

/**
 * Get queue statistics for monitoring
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getQueueStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue stats" },
      { status: 500 }
    );
  }
}
