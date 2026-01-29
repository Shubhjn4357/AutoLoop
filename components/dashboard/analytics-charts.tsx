"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface AnalyticsChartsProps {
    history: Array<{ date: string; total: number; opened: number; clicked: number }>;
    performance: Array<{ workflow_name: string; emails_sent: number; opened: number; clicked: number }>;
}

export function AnalyticsCharts({ history, performance }: AnalyticsChartsProps) {
    // Format date for display
    const formattedHistory = history.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        opened: Number(item.opened),
        clicked: Number(item.clicked),
        total: Number(item.total)
    }));

    const formattedPerformance = performance.map(item => ({
        name: item.workflow_name,
        Sent: Number(item.emails_sent),
        Opened: Number(item.opened),
        Clicked: Number(item.clicked)
    }));

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Engagement Trends (7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedHistory}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total" name="Sent" stroke="#64748b" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="opened" name="Opened" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="clicked" name="Clicked" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Top Workflows Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedPerformance} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                            <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                            <Legend />
                            <Bar dataKey="Sent" fill="#64748b" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="Opened" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
