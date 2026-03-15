"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assessWebVitals, type APIMetric, type PerformanceSummary } from "@/lib/performance-monitoring";

interface WebVitalsStatus {
    lcp: { value: number; status: "good" | "needs-improvement" | "poor" };
    cls: { value: number; status: "good" | "needs-improvement" | "poor" };
    fid: { value: number; status: "good" | "needs-improvement" | "poor" };
}

interface MetricsResponse extends PerformanceSummary {
    apiMetrics: APIMetric[];
}

interface AggregatedApiMetric {
    endpoint: string;
    avgDuration: number;
    maxDuration: number;
}

export function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<PerformanceSummary | null>(null);
    const [vitalsStatus, setVitalsStatus] = useState<WebVitalsStatus | null>(null);
    const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const response = await fetch("/api/performance/metrics");
                if (!response.ok) {
                    throw new Error("Failed to fetch performance metrics");
                }

                const data: MetricsResponse = await response.json();
                setMetrics({
                    lcp: data.lcp,
                    cls: data.cls,
                    fid: data.fid,
                    avgAPITime: data.avgAPITime,
                    slowRequests: data.slowRequests,
                    cachedRequests: data.cachedRequests,
                    totalRequests: data.totalRequests,
                    cacheHitRate: data.cacheHitRate,
                });
                setApiMetrics(data.apiMetrics || []);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
            } finally {
                setLoading(false);
            }
        }

        setVitalsStatus(assessWebVitals() as WebVitalsStatus);
        void fetchMetrics();

        const interval = setInterval(() => {
            void fetchMetrics();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const aggregatedApiMetrics = useMemo<AggregatedApiMetric[]>(() => {
        const byEndpoint = new Map<string, { total: number; count: number; max: number }>();

        for (const metric of apiMetrics) {
            const current = byEndpoint.get(metric.endpoint) || { total: 0, count: 0, max: 0 };
            current.total += metric.duration;
            current.count += 1;
            current.max = Math.max(current.max, metric.duration);
            byEndpoint.set(metric.endpoint, current);
        }

        return Array.from(byEndpoint.entries())
            .map(([endpoint, data]) => ({
                endpoint,
                avgDuration: data.total / data.count,
                maxDuration: data.max,
            }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 10);
    }, [apiMetrics]);

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
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        }

        if (status === "poor") {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        }

        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="space-y-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                                        <p className="text-2xl font-bold">{vitalsStatus.lcp.value.toFixed(0)}ms</p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.lcp.status)}`}>
                                            {vitalsStatus.lcp.status === "good"
                                                ? "Good (<=2500ms)"
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
                                        <p className="text-2xl font-bold">{vitalsStatus.cls.value.toFixed(3)}</p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.cls.status)}`}>
                                            {vitalsStatus.cls.status === "good"
                                                ? "Good (<=0.1)"
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
                                        <p className="text-2xl font-bold">{vitalsStatus.fid.value.toFixed(0)}ms</p>
                                        <p className={`text-xs font-medium ${getStatusColor(vitalsStatus.fid.status)}`}>
                                            {vitalsStatus.fid.status === "good"
                                                ? "Good (<=100ms)"
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
                                    <p className="text-2xl font-bold">{metrics.avgAPITime.toFixed(0)}ms</p>
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
                                    <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Request Distribution</CardTitle>
                            <CardDescription>API endpoint response times distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aggregatedApiMetrics}>
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Performance Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <div>
                            <p className="text-sm font-medium">Enable Caching</p>
                            <p className="text-xs text-muted-foreground">
                                Current cache hit rate: {metrics?.cacheHitRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                        <div>
                            <p className="text-sm font-medium">Monitor Slow Requests</p>
                            <p className="text-xs text-muted-foreground">
                                {metrics?.slowRequests} requests took longer than 1 second
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
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
