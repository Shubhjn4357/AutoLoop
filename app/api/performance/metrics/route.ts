import {  NextResponse } from "next/server";
import { performanceMonitor } from "@/lib/performance-monitoring";

export async function GET() {
    try {
        // Get summary of web vitals and API metrics
        const summary = performanceMonitor.getSummary();

        return NextResponse.json({
            lcp: summary.lcp,
            cls: summary.cls,
            fid: summary.fid,
            avgAPITime: summary.avgAPITime,
            slowRequests: summary.slowRequests,
            cachedRequests: summary.cachedRequests,
            totalRequests: summary.totalRequests,
            cacheHitRate: summary.cacheHitRate,
        });
    } catch (error) {
        console.error("Failed to get performance metrics:", error);
        return NextResponse.json(
            { error: "Failed to fetch metrics" },
            { status: 500 }
        );
    }
}
