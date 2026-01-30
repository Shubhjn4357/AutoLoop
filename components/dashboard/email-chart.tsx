"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface ChartDataPoint {
  name: string;
  sent: number;
  opened: number;
}

interface EmailChartProps {
  data: ChartDataPoint[];
  loading: boolean;
}

export default function EmailChart({ data, loading }: EmailChartProps) {
  if (loading || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "No data available"}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Line
          type="monotone"
          dataKey="sent"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", r: 4 }}
          activeDot={{ r: 6 }}
          name="Emails Sent"
        />
        <Line
          type="monotone"
          dataKey="opened"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
          activeDot={{ r: 6 }}
          name="Emails Opened"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
