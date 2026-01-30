import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { role } = body;

    if (id === session.user.id && (role && role !== "admin")) {
      return new NextResponse("Cannot downgrade your own role", { status: 403 });
    }

    if (role) {
      await db.update(users).set({ role }).where(eq(users.id, id));
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Failed to update user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
