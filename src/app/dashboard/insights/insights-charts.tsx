"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { format } from "date-fns";
import type { IGInsightMetric } from "@/lib/instagram/graph";

interface Props {
  reachMetric: IGInsightMetric | undefined;
  impressionsMetric: IGInsightMetric | undefined;
  profileViewsMetric: IGInsightMetric | undefined;
}

export function InsightsCharts({ reachMetric, impressionsMetric, profileViewsMetric }: Props) {
  // Build unified daily series aligned to reach metric dates
  const dates = reachMetric?.values.map((v) => v.end_time) ?? [];

  const areaData = dates.map((end_time, i) => ({
    date: format(new Date(end_time), "EEE"),
    reach: reachMetric?.values[i]?.value ?? 0,
    impressions: impressionsMetric?.values[i]?.value ?? 0,
    profileViews: profileViewsMetric?.values[i]?.value ?? 0,
  }));

  const hasData = areaData.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Card className="glass-card lg:col-span-4">
        <CardHeader>
          <CardTitle>Reach & Impressions</CardTitle>
          <CardDescription>Daily breakdown from Instagram Graph API</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px] w-full mt-4">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="reach" name="Reach" stroke="var(--primary)" fill="url(#colorReach)" />
                  <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#8b5cf6" fill="url(#colorImpressions)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card lg:col-span-3">
        <CardHeader>
          <CardTitle>Profile Views</CardTitle>
          <CardDescription>Daily visitors to your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  />
                  <Bar dataKey="profileViews" name="Profile Views" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
