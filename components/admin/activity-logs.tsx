"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Filter } from "lucide-react";
import { SystemEvent } from "@/types/admin";

interface ActivityLogsProps {
  logs: SystemEvent[];
  loading?: boolean;
}

export function ActivityLogs({ logs, loading }: ActivityLogsProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const getEventColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.type === filter;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Recent system events and user actions</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getEventColor(log.type)}
                        >
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.message}
                        {log.metadata && (
                          <pre className="mt-1 text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
