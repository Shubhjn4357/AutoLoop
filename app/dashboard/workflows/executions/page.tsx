"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, ZoomIn } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface ExecutionStats {
    stats: {
        total: number;
        successful: number;
        failed: number;
        running: number;
        successRate: number;
    };
    statsByWorkflow: Array<{
        workflowId: string;
        workflowName: string;
        total: number;
        successful: number;
        failed: number;
    }>;
    period: {
        days: number;
        since: string;
        until: string;
    };
}

interface Execution {
    id: string;
    workflowId: string;
    workflowName?: string;
    businessId?: string;
    status: string;
    logs?: string;
    error?: string;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
}

interface ExecutionResponse {
    executions: Execution[];
    total: number;
    limit: number;
    offset: number;
}

export default function ExecutionsPage() {
    const { get } = useApi();
    const [stats, setStats] = useState<ExecutionStats | null>(null);
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [totalExecutions, setTotalExecutions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [days, setDays] = useState("7");
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    const loadStats = useCallback(async () => {
        const result = await get(`/api/workflows/executions/stats?days=${days}`);
        if (result && (result as ExecutionStats).stats) {
            setStats(result as ExecutionStats);
        }
    }, [get, days]);

    const loadExecutions = useCallback(async () => {
        setLoading(true);
        const statusParam = filter === "all" ? "" : `&status=${filter}`;
        const result = await get(`/api/workflows/executions?days=${days}&limit=50&offset=${page * 50}${statusParam}`);
        if (result && (result as ExecutionResponse).executions) {
            setExecutions((result as ExecutionResponse).executions);
            setTotalExecutions((result as ExecutionResponse).total);
        }
        setLoading(false);
    }, [get, days, filter, page]);

    useEffect(() => {
        (async () => {
            await loadStats();
            await loadExecutions();
        })();
    }, [loadStats, loadExecutions]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "failed":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case "running":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success":
                return "bg-green-50 dark:bg-green-950";
            case "failed":
                return "bg-red-50 dark:bg-red-950";
            case "running":
                return "bg-yellow-50 dark:bg-yellow-950";
            default:
                return "";
        }
    };

    const formatDuration = (start: string | null, end: string | null) => {
        if (!start || !end) return "-";
        const duration = new Date(end).getTime() - new Date(start).getTime();
        const seconds = Math.floor(duration / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Workflow Executions</h1>
                    <p className="text-muted-foreground">Monitor and analyze workflow execution history</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.stats.total}</div>
                            <p className="text-xs text-muted-foreground">Last {days} days</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Successful</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.stats.successful}</div>
                            <p className="text-xs text-muted-foreground">{stats.stats.successRate}% success rate</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.stats.failed}</div>
                            <p className="text-xs text-muted-foreground">Requires attention</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 dark:bg-yellow-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Running</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.stats.running}</div>
                            <p className="text-xs text-muted-foreground">In progress</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">By Workflow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.statsByWorkflow.length}</div>
                            <p className="text-xs text-muted-foreground">Active workflows</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Input
                    placeholder="Search by workflow or business..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-xs"
                />
                <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue placeholder="Time period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Last 24 hours</SelectItem>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="success">Successful</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Executions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Executions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Workflow</TableHead>
                                    <TableHead>Business</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Started</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-muted-foreground">Loading...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : executions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-muted-foreground">No executions found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    executions.map((execution) => (
                                        <TableRow key={execution.id} className={getStatusColor(execution.status)}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(execution.status)}
                                                    <Badge variant={execution.status === "success" ? "success" : "destructive"}>
                                                        {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{execution.workflowName || "Unknown"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {execution.businessId?.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDuration(execution.startedAt, execution.completedAt)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(execution.createdAt).toLocaleDateString()} {" "}
                                                {new Date(execution.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" className="h-8 px-3">
                                                    <ZoomIn className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!loading && executions.length > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {page * 50 + 1}-{page * 50 + executions.length} of {totalExecutions}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(page + 1)}
                                    disabled={executions.length < 50}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
