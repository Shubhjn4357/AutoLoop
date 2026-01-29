import { getWorkflowExecutions, getWorkflowStats, getEmailStats, getRecentTriggerExecutions, getEmailMetricsHistory, getWorkflowPerformance } from "@/lib/actions";
import { RecentExecutionsTable } from "@/components/dashboard/recent-executions-table";
import { TriggerHistory } from "@/components/dashboard/trigger-history";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { AutoRefreshToggle } from "@/components/dashboard/real-time-toggle";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function ExecutionsPage() {
    const [stats, executions, emailStats, triggers, history, performance] = await Promise.all([
        getWorkflowStats(),
        getWorkflowExecutions(20),
        getEmailStats(),
        getRecentTriggerExecutions(10),
        getEmailMetricsHistory(7),
        getWorkflowPerformance(),
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Executions & Analytics</h2>
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <a href="/api/executions/export" download>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </a>
                    </Button>
                    <AutoRefreshToggle />
                </div>
            </div>

            <div className="space-y-4">
                {/* Key Metrics Calculation */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <div className="text-sm font-medium text-muted-foreground">Total Sent</div>
                        <div className="text-2xl font-bold">{emailStats.total || 0}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <div className="text-sm font-medium text-muted-foreground">Open Rate</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {
                                emailStats.openRate
                            }%
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <div className="text-sm font-medium text-muted-foreground">Click Rate</div>
                        <div className="text-2xl font-bold text-green-600">
                            {
                                emailStats.clickRate
                            }%
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <div className="text-sm font-medium text-muted-foreground">Workflow Success</div>
                        <div className="text-2xl font-bold">
                            {stats?.total && stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                </div>

                <AnalyticsCharts history={history} performance={performance} />

                <div className="grid gap-4 md:grid-cols-7">
                    <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 flex flex-col gap-4">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Executions</h3>
                            <RecentExecutionsTable executions={executions} />
                        </div>
                    </div>
                    <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 flex flex-col gap-4">
                            <h3 className="font-semibold leading-none tracking-tight">Trigger History</h3>
                            <TriggerHistory triggers={triggers} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
