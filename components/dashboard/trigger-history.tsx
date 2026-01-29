import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TriggerExecution {
    id: string;
    workflowName: string | null;
    triggerId: string;
    status: string;
    executedAt: Date | null;
    error: string | null;
}

interface TriggerHistoryProps {
    triggers: TriggerExecution[];
}

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function TriggerHistory({ triggers }: TriggerHistoryProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Execution Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Error</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {triggers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                                No trigger history found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        triggers.map((trigger) => (
                            <TableRow key={trigger.id}>
                                <TableCell className="font-medium">
                                    {trigger.workflowName || "Unknown"}
                                </TableCell>
                                <TableCell>
                                    {trigger.executedAt ? formatTimeAgo(new Date(trigger.executedAt)) : "-"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={trigger.status === 'success' ? 'default' : 'destructive'}>
                                        {trigger.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-red-500 text-xs max-w-[200px] truncate">
                                    {trigger.error || "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
