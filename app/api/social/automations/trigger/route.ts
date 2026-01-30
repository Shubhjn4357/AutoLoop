/**
 * API endpoint to manually trigger social automation checks
 * Useful for testing without waiting for the worker interval
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SessionUser } from "@/types";
import { socialAutomationWorker } from "@/lib/workers/social-automation";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as SessionUser).id;

        // Only allow admin or authenticated users to trigger
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("🔄 Manually triggered social automation check");

        // Trigger a single check cycle
        const workerAny = socialAutomationWorker as unknown as {
            processAutomations: () => Promise<void>;
        };
        await workerAny.processAutomations();

        return NextResponse.json({
            success: true,
            message: "Social automation check triggered successfully",
        });
    } catch (error) {
        console.error("Error triggering social automation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to trigger automation" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Return worker status
        const workerAny = socialAutomationWorker as unknown as {
            isRunning: boolean;
            checkIntervalMs: number;
        };

        return NextResponse.json({
            isRunning: workerAny.isRunning || false,
            checkIntervalMs: workerAny.checkIntervalMs || 60000,
            status: workerAny.isRunning ? "active" : "stopped",
        });
    } catch (error) {
        console.error("Error getting worker status:", error);
        return NextResponse.json(
            { error: "Failed to get worker status" },
            { status: 500 }
        );
    }
}
