import { db } from "@/db";
import { users, businesses, automationWorkflows, scrapingJobs } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Workflow, Activity } from "lucide-react";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { QuickActions } from "@/components/admin/quick-actions";
import { AnimatedContainer } from "@/components/animated-container";

// import dynamic from "next/dynamic";
/*
const AdminAnalytics = dynamic(() => import("@/components/admin/admin-analytics").then(mod => mod.AdminAnalytics), {
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  ssr: false
});
*/

import { PgTable } from "drizzle-orm/pg-core";

async function getStats() {
  // Helper to get count safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCount = async (table: PgTable<any>) => {
    const res = await db.select({ value: count() }).from(table);
    return res[0].value;
  }

  const [userCount, businessCount, workflowCount, jobCount] = await Promise.all([
    getCount(users),
    getCount(businesses),
    getCount(automationWorkflows),
    getCount(scrapingJobs)
  ]);

  // Active scrapers (status = running)
  const activeJobsRes = await db.select({ value: count() }).from(scrapingJobs).where(eq(scrapingJobs.status, "running"));
  const activeJobs = activeJobsRes[0].value;

  return {
    userCount,
    businessCount,
    workflowCount,
    jobCount,
    activeJobs
  };
}

// Helper function to fetch analytic data
async function getAnalyticsData() {
  // 1. User Growth (Last 30 days)
  const allUsers = await db.select({ createdAt: users.createdAt }).from(users);

  const growthMap = new Map<string, number>();
  allUsers.forEach(u => {
    if (!u.createdAt) return;
    const date = u.createdAt.toISOString().split('T')[0];
    growthMap.set(date, (growthMap.get(date) || 0) + 1);
  });

  const userGrowth = Array.from(growthMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // 2. Business Categories & Email Status
  const allBusinesses = await db.select({
    category: businesses.category,
    emailStatus: businesses.emailStatus
  }).from(businesses);

  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();

  allBusinesses.forEach(b => {
    if (b.category) categoryMap.set(b.category, (categoryMap.get(b.category) || 0) + 1);
    const status = b.emailStatus || "Unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const businessCategories = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  const businessStatus = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

  return { userGrowth, businessCategories, businessStatus };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const analyticsData = await getAnalyticsData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedContainer delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userCount}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Businesses Scraped</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.businessCount}</div>
              <p className="text-xs text-muted-foreground">Total leads database</p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflowCount}</div>
              <p className="text-xs text-muted-foreground">Automated sequences</p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Currently running tasks</p>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4">
          <AnimatedContainer delay={0.5} direction="left">
            <AdminAnalytics
              userGrowth={analyticsData.userGrowth}
              businessCategories={analyticsData.businessCategories}
              businessStatus={analyticsData.businessStatus}
            />
          </AnimatedContainer>
        </div>
        <div className="col-span-3">
          <AnimatedContainer delay={0.6} direction="right">
            <QuickActions />
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}
