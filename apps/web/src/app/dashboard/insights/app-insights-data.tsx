"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Bot, Users, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { serverFetch } from "@/lib/api-client";


interface AppInsightsDataProps {
  userId: string;
  externalId: string;
}

interface AppMetrics {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  automationTriggers: number;
  totalContacts: number;
  newContactsThisWeek: number;
  pendingFollowUps: number;
  activeAutomations: number;
  messagesByDay: { date: string; inbound: number; outbound: number }[];
}

export function AppInsightsData({ userId, externalId }: AppInsightsDataProps) {
  const [metrics, setMetrics] = useState<AppMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await serverFetch(`/api/insights/app?externalId=${externalId}`, userId);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch app insights:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [userId, externalId]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    {
      label: "Total Messages",
      value: metrics.totalMessages.toLocaleString(),
      subtext: `${metrics.inboundMessages} in, ${metrics.outboundMessages} out`,
      icon: MessageSquare,
      trend: metrics.inboundMessages > 0 ? "up" : "neutral",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Automations Triggered",
      value: metrics.automationTriggers.toLocaleString(),
      subtext: `${metrics.activeAutomations} active`,
      icon: Bot,
      trend: "up",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Contacts",
      value: metrics.totalContacts.toLocaleString(),
      subtext: `+${metrics.newContactsThisWeek} this week`,
      icon: Users,
      trend: metrics.newContactsThisWeek > 0 ? "up" : "neutral",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Follow-ups",
      value: metrics.pendingFollowUps.toLocaleString(),
      subtext: "queued messages",
      icon: Clock,
      trend: metrics.pendingFollowUps > 5 ? "up" : "neutral",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">AutoLoop Activity</h2>
        <span className="text-xs text-muted-foreground ml-2">App-level analytics</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, subtext, icon: Icon, trend, color, bg }) => (
          <Card key={label} className="glass-card hover:-translate-y-1 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{value}</div>
                {trend === "up" && <ArrowUpRight className="size-4 text-emerald-500" />}
                {trend === "down" && <ArrowDownRight className="size-4 text-rose-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics.messagesByDay.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Message Activity</CardTitle>
            <CardDescription>Inbound vs outbound messages over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.messagesByDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: "bold", marginBottom: "4px" }}
                  />
                  <Area type="monotone" dataKey="inbound" name="Inbound" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorInbound)" />
                  <Area type="monotone" dataKey="outbound" name="Outbound" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorOutbound)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
