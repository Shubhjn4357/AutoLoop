"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { assessWebVitals } from "@/lib/performance-monitoring";

interface PerformanceMetrics {
    lcp: number;
    cls: number;
    fid: number;
    avgAPITime: number;
    slowRequests: number;
    cachedRequests: number;
    totalRequests: number;
    cacheHitRate: number;
}

interface WebVitalsStatus {
    lcp: { value: number; status: "good" | "needs-improvement" | "poor" };
    cls: { value: number; status: "good" | "needs-improvement" | "poor" };
    fid: { value: number; status: "good" | "needs-improvement" | "poor" };
}

export function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [vitalsStatus, setVitalsStatus] = useState<WebVitalsStatus | null>(null);
    const [apiMetrics, setApiMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch metrics from server
        async function fetchMetrics() {
            try {
                const response = await fetch("/api/performance/metrics");
                if (response.ok) {
                    const data = await response.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
            } finally {
                setLoading(false);
            }
        }

        // Assess Web Vitals
        const vitals = assessWebVitals();
        setVitalsStatus(vitals as WebVitalsStatus);
        fetchMetrics();

        // Refresh metrics every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "good":
                return "text-green-600";
            case "needs-improvement":
                return "text-yellow-600";
            case "poor":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === "good") {
            return <CheckCircle className="w-4 h-4 text-green-600" />;
        }
        if (status === "poor") {
            return <AlertCircle className="w-4 h-4 text-red-600" />;
        }
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Web Vitals Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                {vitalsStatus && (
                    <>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Largest Contentful Paint (LCP)</CardTitle>
                                <CardDescription>Page loading performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {vitalsStatus.lcp.value.toFixed(0)}ms
                                        </p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.lcp.status)}`}>
                                            {vitalsStatus.lcp.status === "good"
                                                ? "Good (≤2500ms)"
                                                : vitalsStatus.lcp.status === "needs-improvement"
                                                    ? "Needs Improvement (2500-4000ms)"
                                                    : "Poor (>4000ms)"}
                                        </p>
                                    </div>
                                    {getStatusIcon(vitalsStatus.lcp.status)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Cumulative Layout Shift (CLS)</CardTitle>
                                <CardDescription>Visual stability</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {vitalsStatus.cls.value.toFixed(3)}
                                        </p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.cls.status)}`}>
                                            {vitalsStatus.cls.status === "good"
                                                ? "Good (≤0.1)"
                                                : vitalsStatus.cls.status === "needs-improvement"
                                                    ? "Needs Improvement (0.1-0.25)"
                                                    : "Poor (>0.25)"}
                                        </p>
                                    </div>
                                    {getStatusIcon(vitalsStatus.cls.status)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">First Input Delay (FID)</CardTitle>
                                <CardDescription>Interactivity responsiveness</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {vitalsStatus.fid.value.toFixed(0)}ms
                                        </p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.fid.status)}`}>
                                            {vitalsStatus.fid.status === "good"
                                                ? "Good (≤100ms)"
                                                : vitalsStatus.fid.status === "needs-improvement"
                                                    ? "Needs Improvement (100-300ms)"
                                                    : "Poor (>300ms)"}
                                        </p>
                                    </div>
                                    {getStatusIcon(vitalsStatus.fid.status)}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* API Performance */}
            {metrics && (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">API Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Average Response Time</p>
                                    <p className="text-2xl font-bold">
                                        {metrics.avgAPITime.toFixed(0)}ms
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Slow Requests (&gt;1s)</p>
                                    <p className="text-2xl font-bold">{metrics.slowRequests}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Caching Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
                                    <p className="text-2xl font-bold">
                                        {metrics.cacheHitRate.toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Cached Requests</p>
                                    <p className="text-2xl font-bold">
                                        {metrics.cachedRequests}/{metrics.totalRequests}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* API Performance Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Distribution</CardTitle>
                            <CardDescription>API endpoint response times distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={apiMetrics.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="avgDuration" fill="#3b82f6" name="Avg Duration (ms)" />
                                        <Bar dataKey="maxDuration" fill="#ef4444" name="Max Duration (ms)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Performance Tips */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Performance Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Enable Caching</p>
                            <p className="text-xs text-muted-foreground">
                                Current cache hit rate: {metrics?.cacheHitRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Monitor Slow Requests</p>
                            <p className="text-xs text-muted-foreground">
                                {metrics?.slowRequests} requests took longer than 1 second
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Bundle Analysis</p>
                            <p className="text-xs text-muted-foreground">
                                Use &quot;npm run build:analyze&quot; to identify large dependencies
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
