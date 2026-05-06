import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountId = body.accountId as string | undefined;

  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  const account = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.id, accountId),
  });

  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(instagramAccounts).where(eq(instagramAccounts.id, accountId));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard");

  return NextResponse.json({ success: true });
}
