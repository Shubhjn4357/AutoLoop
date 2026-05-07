"use client";

import { Bot, MessageCircle, BarChart3, Clock3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageChart } from "@/components/charts/message-chart-dynamic";
import { NotificationLog } from "@/components/dashboard/notification-log";

interface DashboardData {
  connectionCount: number;
  activeAutomationCount: number;
  messageCount: number;
  pendingFollowUpCount: number;
  chartData: { date: string; messages: number }[];
  recentLogs: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    status: string;
    metadata: string | null;
    createdAt: Date;
  }[];
}

export function DashboardContent({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">Overview & Analytics</h2>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Accounts</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.connectionCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Automations</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Bot className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeAutomationCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">DMs Processed</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.messageCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Queued Follow-ups</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Clock3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingFollowUpCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Main Analytics Chart */}
        <Card className="col-span-1 lg:col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Conversation Velocity</CardTitle>
            <CardDescription>
              Volume of messages received and processed over the trailing week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageChart data={data.chartData} />
          </CardContent>
        </Card>

        {/* Calls to action */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to activate flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">1. Connect Instagram</span>
                <Link href="/dashboard/settings" className="px-3 py-1 bg-muted rounded-md text-sm hover:bg-accent transition-colors">Setup</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">2. Create Automation Rule</span>
                <Link href="/dashboard/automations" className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors">Go</Link>
              </div>
            </CardContent>
          </Card>
          <NotificationLog logs={data.recentLogs} />
        </div>
      </div>
    </div>
  );
}
