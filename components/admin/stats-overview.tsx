"use client";

import { Users, Activity, Workflow, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsOverviewProps {
  stats: AdminStats | null;
  loading: boolean;
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const healthColor = {
    healthy: "text-green-500",
    degraded: "text-amber-500",
    down: "text-red-500",
  }[stats.systemHealth];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.userGrowth > 0 ? "+" : ""}
            {stats.userGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">in the last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          <Workflow className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
          <p className="text-xs text-muted-foreground">
            Active across the platform
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold capitalize ${healthColor}`}>
            {stats.systemHealth}
          </div>
          <p className="text-xs text-muted-foreground">
            All services operational
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
