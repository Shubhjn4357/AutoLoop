"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Activity, BarChart3, Settings, FileText } from "lucide-react";
import { StatsOverview } from "@/components/admin/stats-overview";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { UserGrowthChart } from "@/components/admin/user-growth-chart";
import { PlatformUsageChart } from "@/components/admin/platform-usage-chart";
import { ActivityLogs } from "@/components/admin/activity-logs";
import { SystemControls } from "@/components/admin/system-controls";
import { AdminStats, AdminUser, SystemEvent } from "@/types/admin";
import { useApi } from "@/hooks/use-api";

// Mock data for initial render/development
const MOCK_STATS: AdminStats = {
  totalUsers: 156,
  userGrowth: 12,
  activeUsers: 84,
  totalWorkflows: 342,
  systemHealth: "healthy",
};

const MOCK_GROWTH_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  users: 100 + Math.floor(Math.random() * 50) + i * 2,
}));

const MOCK_USAGE_DATA = [
  { name: "Emails Sent", value: 4500 },
  { name: "Workflows", value: 1230 },
  { name: "Scrapers", value: 890 },
  { name: "API Calls", value: 15400 },
];

const MOCK_USERS: AdminUser[] = [
  { id: "1", name: "John Doe", email: "john@example.com", image: null, role: "admin", status: "active", lastActive: new Date(), createdAt: new Date("2023-01-01") },
  { id: "2", name: "Jane Smith", email: "jane@company.com", image: null, role: "user", status: "active", lastActive: new Date(Date.now() - 86400000), createdAt: new Date("2023-02-15") },
  { id: "3", name: "Bob Johnson", email: "bob@test.com", image: null, role: "user", status: "inactive", lastActive: null, createdAt: new Date("2023-03-10") },
  { id: "4", name: "Alice Brown", email: "alice@demo.com", image: null, role: "user", status: "suspended", lastActive: new Date(Date.now() - 7 * 86400000), createdAt: new Date("2023-04-05") },
];

const MOCK_LOGS: SystemEvent[] = [
  { id: "1", type: "info", message: "User John Doe logged in", timestamp: new Date(), metadata: { ip: "192.168.1.1" } },
  { id: "2", type: "success", message: "Workflow 'Lead Gen' completed successfully", timestamp: new Date(Date.now() - 3600000), metadata: { distinctId: "wf_123" } },
  { id: "3", type: "warning", message: "Rate limit approached for user Jane Smith", timestamp: new Date(Date.now() - 7200000) },
  { id: "4", type: "error", message: "Failed to connect to SMTP server", timestamp: new Date(Date.now() - 86400000), metadata: { retryCount: 3 } },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<SystemEvent[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const { get: getStats } = useApi<AdminStats>();
  const { get: getUsers } = useApi<{ users: AdminUser[] }>();
  // const { get: getLogs } = useApi<{ logs: SystemEvent[] }>();

  useEffect(() => {
    const fetchData = async () => {
      setDbLoading(true);
      try {
        const [statsData, usersData] = await Promise.all([
          getStats("/api/admin/stats"),
          getUsers("/api/admin/users")
        ]);

        if (statsData) setStats(statsData);
        if (usersData?.users) setUsers(usersData.users);
        setLogs(MOCK_LOGS); // Keep mock logs for now until API is ready
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setDbLoading(false);
      }
    };
    fetchData();
  }, [getStats, getUsers]);

  const handleUpdateStatus = async (userId: string, newStatus: "active" | "suspended") => {
    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, status: "active" } : u)); // Reset to active or previous state
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "user" | "admin") => {
    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update role");
    } catch (error) {
      console.error("Error updating role:", error);
      // Revert
      setUsers(users.map(u => u.id === userId ? { ...u, role: "user" } : u));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, view analytics, and control system settings
        </p>
      </div>

      <StatsOverview stats={stats} loading={dbLoading} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <UserGrowthChart data={MOCK_GROWTH_DATA} />
            </div>
            <div className="col-span-3">
              <PlatformUsageChart data={MOCK_USAGE_DATA} />
            </div>
          </div>
          <ActivityLogs logs={logs.slice(0, 5)} loading={dbLoading} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTable
                users={users}
                onUpdateStatus={handleUpdateStatus}
                onUpdateRole={handleUpdateRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <UserGrowthChart data={MOCK_GROWTH_DATA} />
            <PlatformUsageChart data={MOCK_USAGE_DATA} />
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemControls />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <ActivityLogs logs={logs} loading={dbLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
