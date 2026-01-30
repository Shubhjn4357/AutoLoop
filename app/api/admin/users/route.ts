import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));

    if (search) {
      // @ts-expect-error - Drizzle types issue with dynamic where
      query = query.where(
        or(
          // cast to unknown to avoid lint errors if schema changes imply type mismatches temporarily
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    const allUsers = await query;

    const adminUsers = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
      status: "active",
      lastActive: new Date(),
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: adminUsers });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
