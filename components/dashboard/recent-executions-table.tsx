import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ExecutionStatusBadge } from "./execution-status-badge";

interface Execution {
    id: string;
    workflowName: string | null;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null; // Added completedAt
    duration: string;
    error: string | null;
    logs: string | null;
}

interface RecentExecutionsTableProps {
    executions: Execution[];
}

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function RecentExecutionsTable({ executions }: RecentExecutionsTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Execution ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {executions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No executions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        executions.map((execution) => (
                            <TableRow key={execution.id}>
                                <TableCell className="font-medium">
                                    {execution.workflowName || "Unknown"}
                                </TableCell>
                                <TableCell>
                                    <ExecutionStatusBadge status={execution.status} />
                                    {execution.error && (
                                        <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate">
                                            {execution.error}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {execution.startedAt
                                        ? formatTimeAgo(new Date(execution.startedAt))
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    {execution.completedAt && execution.startedAt ?
                                        ((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(1) + "s"
                                        : "..."
                                    }
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                    {execution.id.slice(0, 8)}...
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
