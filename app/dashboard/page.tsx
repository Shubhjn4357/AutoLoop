"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { BusinessTable } from "@/components/dashboard/business-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Business } from "@/types";
import { Users, Mail, TrendingUp, ArrowRight, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatedContainer } from "@/components/animated-container";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const EmailChart = dynamic(() => import("@/components/dashboard/email-chart"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false
});

const LeadDemographicsChart = dynamic(() => import("@/components/dashboard/lead-demographics-chart"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false
});

interface DashboardStats {
  totalBusinesses: number;
  emailsSent: number;
  openRate: number;
  quotaUsed: number;
  quotaLimit: number;
}

interface ChartDataPoint {
  name: string;
  sent: number;
  opened: number;
}

interface DemographicData {
  name: string;
  value: number;
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);

  // API Hooks
  const { get: getBusinessesApi, loading: loadingBusinesses } = useApi<{ businesses: Business[] }>();
  const { get: getStatsApi, loading: loadingStats } = useApi<{ stats: DashboardStats; chartData: ChartDataPoint[] }>();

  useEffect(() => {
    const fetchData = async () => {
      const [businessData, statsData] = await Promise.all([
        getBusinessesApi("/api/businesses"),
        getStatsApi("/api/dashboard/stats")
      ]);

      if (businessData?.businesses) {
        setBusinesses(businessData.businesses);

        // Calculate demographics from businesses
        const typeCount: Record<string, number> = {};
        businessData.businesses.forEach((b) => {
          const type = b.category || "Unknown";
          typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const demoData = Object.entries(typeCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5

        setDemographics(demoData);
      }
      if (statsData) {
        setStats(statsData.stats);
        setChartData(statsData.chartData || []);
      }
    };
    fetchData();
  }, [getBusinessesApi, getStatsApi]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Your agency performance at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/scraper">
              Start New Search <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats || !stats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
            <>
              <AnimatedContainer delay={0.1}>
                <StatCard title="Total Leads" value={stats.totalBusinesses.toString()} icon={Users} />
              </AnimatedContainer>
              <AnimatedContainer delay={0.2}>
                <StatCard title="Emails Sent" value={stats.emailsSent.toString()} icon={Mail} />
              </AnimatedContainer>
              <AnimatedContainer delay={0.3}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Email Quota</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.quotaUsed} / {stats.quotaLimit}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.quotaUsed / stats.quotaLimit) * 100)}% used
                    </p>
                    <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stats.quotaUsed >= stats.quotaLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((stats.quotaUsed / stats.quotaLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            <AnimatedContainer delay={0.4}>
              <StatCard title="Open Rate" value={`${stats.openRate}%`} icon={TrendingUp} />
            </AnimatedContainer>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Email Performance</CardTitle>
            <CardDescription>Sent vs Opened emails over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <EmailChart data={chartData} loading={loadingStats} />
          </CardContent>
        </Card>

        {/* Lead Demographics */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Lead Demographics</CardTitle>
            <CardDescription>Business types distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadDemographicsChart data={demographics} loading={loadingBusinesses} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Businesses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/businesses">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <BusinessTable
            businesses={businesses.slice(0, 5)}
            onViewDetails={() => { }}
            onSendEmail={() => { }}
            isLoading={loadingBusinesses}
          />
        </CardContent>
      </Card>
    </div>
  );
}
