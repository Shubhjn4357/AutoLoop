"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailStats {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    openRate: string;
    clickRate: string;
    deliveryRate: string;
}

interface EmailDelivery {
    id: string;
    status: string;
    subject: string;
    sentAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    errorMessage?: string;
}

interface DeliveryStatsResponse {
    stats: EmailStats;
    recentDeliveries: EmailDelivery[];
}

export default function EmailDeliveryPage() {
    const { get } = useApi();
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState("7");

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            const result = await get(`/api/email/delivery-stats?days=${days}`) as DeliveryStatsResponse | null;
            if (result) {
                setStats(result.stats);
                setDeliveries(result.recentDeliveries || []);
            }
            setLoading(false);
        };
        loadStats();
    }, [get,days]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "sent":
                return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
            case "opened":
                return <Badge className="bg-green-100 text-green-800">Opened</Badge>;
            case "clicked":
                return <Badge className="bg-green-600 text-white">Clicked</Badge>;
            case "bounced":
                return <Badge className="bg-yellow-100 text-yellow-800">Bounced</Badge>;
            case "failed":
            case "error":
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Email Delivery Tracking</h1>
                    <p className="text-muted-foreground">Monitor open rates, click rates, and delivery metrics</p>
                </div>
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
            </div>

            {/* Metrics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">emails</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                            <p className="text-xs text-muted-foreground">{stats.deliveryRate}% success</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Opened</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.opened}</div>
                            <p className="text-xs text-muted-foreground">{stats.openRate}% open rate</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-50 dark:bg-emerald-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Clicked</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{stats.clicked}</div>
                            <p className="text-xs text-muted-foreground">{stats.clickRate}% CTR</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 dark:bg-yellow-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.bounced}</div>
                            <p className="text-xs text-muted-foreground">invalid emails</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <p className="text-xs text-muted-foreground">delivery errors</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Deliveries */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Email Deliveries</CardTitle>
                    <CardDescription>Latest email tracking events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead>Opened</TableHead>
                                    <TableHead>Clicked</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-muted-foreground">Loading...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : deliveries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-muted-foreground">No deliveries found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    deliveries.map((delivery) => (
                                        <TableRow key={delivery.id}>
                                            <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                                            <TableCell className="max-w-xs line-clamp-1">{delivery.subject}</TableCell>
                                            <TableCell className="text-sm">{formatDate(delivery.sentAt)}</TableCell>
                                            <TableCell className="text-sm">
                                                {delivery.openedAt ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="h-3 w-3" />
                                                        {formatDate(delivery.openedAt)}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {delivery.clickedAt ? (
                                                    <div className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle className="h-3 w-3" />
                                                        {formatDate(delivery.clickedAt)}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-red-600">
                                                {delivery.errorMessage ? (
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {delivery.errorMessage}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6 space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">📧 How Email Tracking Works</p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                        <li>We track opens when recipients load the email</li>
                        <li>We track clicks when recipients click links in emails</li>
                        <li>Bounces are tracked automatically by email providers</li>
                        <li>Failed deliveries show in the Error column</li>
                        <li>All tracking is automatic - no additional setup needed</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
