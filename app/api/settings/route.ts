import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UpdateUserData {
  name?: string;
  geminiApiKey?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  customVariables?: Record<string, string>;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);

    // Fetch user with API keys
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        geminiApiKey: users.geminiApiKey,
        accessToken: users.accessToken,
        linkedinSessionCookie: users.linkedinSessionCookie,
        phone: users.phone,
        jobTitle: users.jobTitle,
        company: users.company,
        website: users.website,
        customVariables: users.customVariables,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mask sensitive keys for display
    const maskedGeminiKey = user.geminiApiKey
      ? `••••••••${user.geminiApiKey.slice(-4)}`
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        geminiApiKey: maskedGeminiKey,
        isGeminiKeySet: !!user.geminiApiKey,
        isGmailConnected: !!user.accessToken,
        isLinkedinCookieSet: !!user.linkedinSessionCookie,
        phone: user.phone,
        jobTitle: user.jobTitle,
        company: user.company,
        website: user.website,
        customVariables: user.customVariables,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);
    const body = await request.json();

    const updateData: UpdateUserData & { linkedinSessionCookie?: string } = {
      updatedAt: new Date(),
    };

    // Only update fields that are present in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.geminiApiKey !== undefined) updateData.geminiApiKey = body.geminiApiKey;
    if (body.linkedinSessionCookie !== undefined) updateData.linkedinSessionCookie = body.linkedinSessionCookie;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.customVariables !== undefined) updateData.customVariables = body.customVariables;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
