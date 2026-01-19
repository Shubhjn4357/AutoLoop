import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const body = await req.json().catch(() => ({}));
        const { message, type = "general", name, email, subject } = body;

        if (!message) {
            return new NextResponse("Message is required", { status: 400 });
        }

        await db.insert(feedback).values({
            id: nanoid(),
            userId: session?.user?.id || null,
            visitorName: name || null,
            visitorEmail: email || null,
            subject: subject || null,
            message,
            type,
            status: "new",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FEEDBACK_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
    try {
        const session = await auth();
        // Strict Admin Check
        if (session?.user?.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Use standard select query for reliability
        const items = await db
            .select()
            .from(feedback)
            .orderBy(desc(feedback.createdAt));

        return NextResponse.json(items);

    } catch (error) {
        console.error("[FEEDBACK_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
