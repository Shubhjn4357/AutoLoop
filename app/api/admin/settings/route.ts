
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // specific type imports might be needed if strictly typed
    // Get the most recent settings or create default
    let [settings] = await db
      .select()
      .from(systemSettings)
      .orderBy(desc(systemSettings.updatedAt))
      .limit(1);

    if (!settings) {
      // Initialize default settings
      [settings] = await db.insert(systemSettings).values({
        featureFlags: {
            betaFeatures: false,
            registration: true,
            maintenance: false,
        },
        emailConfig: {
            dailyLimit: 10000,
            userRateLimit: 50,
        }
      }).returning();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { featureFlags, emailConfig } = body;

    // specific type imports might be needed if strictly typed
    // Update existing or create new
    const [existing] = await db
      .select()
      .from(systemSettings)
      .orderBy(desc(systemSettings.updatedAt))
      .limit(1);

    let settings;
    if (existing) {
       [settings] = await db
        .update(systemSettings)
        .set({
          featureFlags,
          emailConfig,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.id, existing.id)) // Use ID to be safe
        .returning();
    } else {
        [settings] = await db.insert(systemSettings).values({
            featureFlags,
            emailConfig,
        }).returning();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
