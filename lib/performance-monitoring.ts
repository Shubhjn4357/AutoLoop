'use client'

import { useEffect, useState } from "react";

/**
 * Performance Monitoring Utilities
 * Tracks Web Vitals (LCP, FID, CLS) and API response times
 */

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    context?: Record<string, any>;
}

interface APIMetric {
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
    cached?: boolean;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private apiMetrics: APIMetric[] = [];
    private isEnabled = typeof window !== "undefined";

    /**
     * Initialize Web Vitals tracking
     * Measures: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
     */
    initWebVitals() {
        if (!this.isEnabled) return;

        // Track LCP (Largest Contentful Paint)
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === "largest-contentful-paint") {
                    this.recordMetric({
                        name: "LCP",
                        value: entry.startTime,
                        unit: "ms",
                        timestamp: Date.now(),
                        context: {
                            element: (entry as any).element?.tagName,
                            url: (entry as any).url,
                        },
                    });
                }
            }
        });

        observer.observe({ entryTypes: ["largest-contentful-paint"] });

        // Track CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;
                    this.recordMetric({
                        name: "CLS",
                        value: clsValue,
                        unit: "score",
                        timestamp: Date.now(),
                    });
                }
            }
        });

        clsObserver.observe({ entryTypes: ["layout-shift"] });

        // Track FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === "first-input") {
                    this.recordMetric({
                        name: "FID",
                        value: (entry as any).processingDuration,
                        unit: "ms",
                        timestamp: Date.now(),
                    });
                }
            }
        });

        fidObserver.observe({ entryTypes: ["first-input"] });
    }

    /**
     * Track API request performance
     * Called from API interceptor or fetch wrapper
     */
    recordAPIMetric(metric: APIMetric) {
        this.apiMetrics.push(metric);

        // Keep only last 100 metrics in memory
        if (this.apiMetrics.length > 100) {
            this.apiMetrics.shift();
        }

        // Send slow requests (>1s) to monitoring service
        if (metric.duration > 1000) {
            this.reportSlowRequest(metric);
        }
    }

    /**
     * Record custom performance metric
     */
    recordMetric(metric: PerformanceMetric) {
        this.metrics.push(metric);

        // Keep only last 100 metrics in memory
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }

        // Log metrics that exceed thresholds
        if (metric.name === "LCP" && metric.value > 2500) {
            console.warn(`LCP exceeded threshold: ${metric.value.toFixed(2)}ms`);
        }
        if (metric.name === "CLS" && metric.value > 0.1) {
            console.warn(`CLS exceeded threshold: ${metric.value.toFixed(3)}`);
        }
    }

    /**
     * Get performance summary for dashboard
     */
    getSummary() {
        const lcp = this.metrics.find((m) => m.name === "LCP");
        const cls = this.metrics.find((m) => m.name === "CLS");
        const fid = this.metrics.find((m) => m.name === "FID");

        const avgAPITime =
            this.apiMetrics.length > 0
                ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) /
                this.apiMetrics.length
                : 0;

        const slowRequests = this.apiMetrics.filter((m) => m.duration > 1000).length;
        const cachedRequests = this.apiMetrics.filter((m) => m.cached).length;

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

    /**
     * Get all API metrics for analytics
     */
    getAPIMetrics() {
        return [...this.apiMetrics];
    }

    /**
     * Report slow or failed requests to monitoring service
     */
    private reportSlowRequest(metric: APIMetric) {
        // In production, send to Sentry or performance monitoring service
        if (typeof window !== "undefined" && (window as any).__SENTRY__) {
            // Sentry integration point
            console.debug("Slow API request detected:", metric);
        }
    }

    /**
     * Clear metrics (useful for testing or reset)
     */
    clearMetrics() {
        this.metrics = [];
        this.apiMetrics = [];
    }

    /**
     * Export metrics for analysis
     */
    exportMetrics() {
        return {
            webVitals: this.metrics,
            apiMetrics: this.apiMetrics,
            summary: this.getSummary(),
            timestamp: Date.now(),
        };
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to use performance monitoring in React components
 */
export function usePerformanceMonitoring() {
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        performanceMonitor.initWebVitals();

        // Update metrics every 5 seconds
        const interval = setInterval(() => {
            setMetrics(performanceMonitor.getSummary());
        }, 5000);

        // Initial read
        setMetrics(performanceMonitor.getSummary());

        return () => clearInterval(interval);
    }, []);

    return metrics;
}

/**
 * Wrapper for fetch to automatically track performance
 */
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

/**
 * Get Core Web Vitals assessment
 * Returns: Good, Needs Improvement, or Poor
 */
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

