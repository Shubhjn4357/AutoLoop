import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createABTest, determineABTestWinner } from "@/lib/ab-testing";
import { SessionUser } from "@/types";

/**
 * Create a new A/B test
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await request.json();
    const { name, templateA, templateB, splitPercentage } = body;

    const test = await createABTest({
      userId,
      name,
      templateA,
      templateB,
      splitPercentage,
    });

    return NextResponse.json({ test });
  } catch (error: unknown) {
    console.error("Error creating A/B test:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create A/B test" },
      { status: 500 }
    );
  }
}

/**
 * Get A/B test winner
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");
    const templateA = searchParams.get("templateA");
    const templateB = searchParams.get("templateB");

    if (!templateA || !templateB) {
      return NextResponse.json(
        { error: "Template IDs required" },
        { status: 400 }
      );
    }

    // Mock test object for winner determination
    const test = {
      id: testId || "test",
      name: "A/B Test",
      templateA,
      templateB,
      splitPercentage: 50,
      status: "active" as const,
      startedAt: new Date(),
    };

    const result = await determineABTestWinner(test);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error determining winner:", error);
    return NextResponse.json(
      { error: "Failed to determine winner" },
      { status: 500 }
    );
  }
}
