import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get user growth over last 30 days
    const usersByDate = await db.execute(sql`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM ${users} 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    let cumulativeUsers = 0;
    const userGrowth = usersByDate.rows.map((row) => {
      const typedRow = row as unknown as { date: string, count: number };
      cumulativeUsers += Number(typedRow.count);
      return {
        date: new Date(typedRow.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        users: cumulativeUsers
      };
    });

    return NextResponse.json({
      userGrowth,
      platformUsage: [
        { name: "Emails", value: 120 }, // Placeholder
        { name: "Workflows", value: 50 }, // Placeholder
      ]
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
