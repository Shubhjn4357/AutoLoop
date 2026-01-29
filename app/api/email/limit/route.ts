
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRemainingEmails } from "@/lib/rate-limit";
import { SessionUser } from "@/types";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        const remaining = await getRemainingEmails(user.id);

        return NextResponse.json({
            limit: 50,
            remaining,
            resetIn: "Daily (00:00 UTC)"
        });
    } catch (error) {
        console.error("Error fetching email limit:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
