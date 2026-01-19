import { db } from "@/db";
import { users, businesses, automationWorkflows, scrapingJobs } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Workflow, Database, Activity } from "lucide-react";

async function getStats() {
    // Helper to get count safely
    const getCount = async (table: any) => {
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

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
      
      {/* Activity Graph Placeholder - Could be implemented with Recharts if needed */}
      <Card className="col-span-4">
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                Activity Graph Component to be added with Recharts
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
