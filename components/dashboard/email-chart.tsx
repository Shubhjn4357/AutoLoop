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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="sent"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="opened"
          stroke="#10b981"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
