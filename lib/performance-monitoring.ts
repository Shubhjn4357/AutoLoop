'use client'

import { useEffect, useState } from "react";

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    context?: Record<string, unknown>;
}

export interface APIMetric {
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
    cached?: boolean;
}

export interface PerformanceSummary {
    lcp: number;
    cls: number;
    fid: number;
    avgAPITime: number;
    slowRequests: number;
    cachedRequests: number;
    totalRequests: number;
    cacheHitRate: number;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
    element?: Element | null;
    url?: string;
}

interface LayoutShiftEntry extends PerformanceEntry {
    hadRecentInput: boolean;
    value: number;
}

interface FirstInputEntry extends PerformanceEntry {
    processingStart: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private apiMetrics: APIMetric[] = [];
    private isEnabled = typeof window !== "undefined";

    initWebVitals() {
        if (!this.isEnabled || typeof PerformanceObserver === "undefined") {
            return;
        }

        const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as LargestContentfulPaintEntry[]) {
                if (entry.entryType !== "largest-contentful-paint") {
                    continue;
                }

                this.recordMetric({
                    name: "LCP",
                    value: entry.startTime,
                    unit: "ms",
                    timestamp: Date.now(),
                    context: {
                        element: entry.element?.tagName,
                        url: entry.url,
                    },
                });
            }
        });

        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as LayoutShiftEntry[]) {
                if (entry.hadRecentInput) {
                    continue;
                }

                clsValue += entry.value;
                this.recordMetric({
                    name: "CLS",
                    value: clsValue,
                    unit: "score",
                    timestamp: Date.now(),
                });
            }
        });

        clsObserver.observe({ entryTypes: ["layout-shift"] });

        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as FirstInputEntry[]) {
                if (entry.entryType !== "first-input") {
                    continue;
                }

                this.recordMetric({
                    name: "FID",
                    value: entry.processingStart - entry.startTime,
                    unit: "ms",
                    timestamp: Date.now(),
                });
            }
        });

        fidObserver.observe({ entryTypes: ["first-input"] });
    }

    recordAPIMetric(metric: APIMetric) {
        this.apiMetrics.push(metric);

        if (this.apiMetrics.length > 100) {
            this.apiMetrics.shift();
        }

        if (metric.duration > 1000) {
            this.reportSlowRequest(metric);
        }
    }

    recordMetric(metric: PerformanceMetric) {
        this.metrics.push(metric);

        if (this.metrics.length > 100) {
            this.metrics.shift();
        }

        if (metric.name === "LCP" && metric.value > 2500) {
            console.warn(`LCP exceeded threshold: ${metric.value.toFixed(2)}ms`);
        }

        if (metric.name === "CLS" && metric.value > 0.1) {
            console.warn(`CLS exceeded threshold: ${metric.value.toFixed(3)}`);
        }
    }

    getSummary(): PerformanceSummary {
        const lcp = this.metrics.find((metric) => metric.name === "LCP");
        const cls = this.metrics.find((metric) => metric.name === "CLS");
        const fid = this.metrics.find((metric) => metric.name === "FID");

        const avgAPITime =
            this.apiMetrics.length > 0
                ? this.apiMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.apiMetrics.length
                : 0;

        const slowRequests = this.apiMetrics.filter((metric) => metric.duration > 1000).length;
        const cachedRequests = this.apiMetrics.filter((metric) => metric.cached).length;

        return {
            lcp: lcp?.value || 0,
            cls: cls?.value || 0,
            fid: fid?.value || 0,
            avgAPITime,
            slowRequests,
            cachedRequests,
            totalRequests: this.apiMetrics.length,
            cacheHitRate:
                this.apiMetrics.length > 0
                    ? (cachedRequests / this.apiMetrics.length) * 100
                    : 0,
        };
    }

    getAPIMetrics() {
        return [...this.apiMetrics];
    }

    clearMetrics() {
        this.metrics = [];
        this.apiMetrics = [];
    }

    exportMetrics() {
        return {
            webVitals: this.metrics,
            apiMetrics: this.apiMetrics,
            summary: this.getSummary(),
            timestamp: Date.now(),
        };
    }

    private reportSlowRequest(metric: APIMetric) {
        if (typeof window === "undefined") {
            return;
        }

        const sentryWindow = window as Window & { __SENTRY__?: unknown };

        if (sentryWindow.__SENTRY__) {
            console.debug("Slow API request detected:", metric);
        }
    }
}

export const performanceMonitor = new PerformanceMonitor();

export function usePerformanceMonitoring() {
    const [metrics, setMetrics] = useState<PerformanceSummary>(() => performanceMonitor.getSummary());

    useEffect(() => {
        performanceMonitor.initWebVitals();

        const interval = setInterval(() => {
            setMetrics(performanceMonitor.getSummary());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return metrics;
}

export async function fetchWithMetrics(
    url: string,
    options?: RequestInit & { cached?: boolean }
) {
    const start = performance.now();
    const method = options?.method || "GET";

    try {
        const response = await fetch(url, options);
        const duration = performance.now() - start;

        performanceMonitor.recordAPIMetric({
            endpoint: url,
            method,
            duration,
            status: response.status,
            timestamp: Date.now(),
            cached: options?.cached || false,
        });

        return response;
    } catch (error) {
        const duration = performance.now() - start;

        performanceMonitor.recordAPIMetric({
            endpoint: url,
            method,
            duration,
            status: 0,
            timestamp: Date.now(),
            cached: false,
        });

        throw error;
    }
}

export function assessWebVitals() {
    const summary = performanceMonitor.getSummary();

    return {
        lcp: {
            value: summary.lcp,
            status: summary.lcp <= 2500 ? "good" : summary.lcp <= 4000 ? "needs-improvement" : "poor",
        },
        fid: {
            value: summary.fid,
            status: summary.fid <= 100 ? "good" : summary.fid <= 300 ? "needs-improvement" : "poor",
        },
        cls: {
            value: summary.cls,
            status: summary.cls <= 0.1 ? "good" : summary.cls <= 0.25 ? "needs-improvement" : "poor",
        },
    };
}
