/**
 * Global Task Monitor
 * Shows real-time status of all background tasks
 */

"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@/lib/hooks/use-api';
import { Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/utils';
import type { Task } from '@/lib/queue/task-queue';

interface MonitorData {
  tasks: Task[];
  stats: Array<{
    type: string;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }>;
  totalActive: number;
}

export function GlobalTaskMonitor() {
  const [isOpen, setIsOpen] = useState(false);

  // Poll every 3 seconds
  const { data, refetch } = useQuery<MonitorData>('/api/tasks/monitor', {
    refetchOnMount: true,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch]);

  const totalActive = data?.totalActive || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-accent rounded-md transition-colors"
          title="Background Tasks"
        >
          <Loader2 className={`h-5 w-5 ${totalActive > 0 ? 'animate-spin text-blue-600' : 'text-muted-foreground'}`} />
          {totalActive > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-xs text-white flex items-center justify-center font-semibold">
              {totalActive}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Background Tasks</h3>
            <Badge variant="outline">
              {totalActive} active
            </Badge>
          </div>

          {/* Queue Statistics */}
          <div className="grid grid-cols-2 gap-2">
            {data?.stats?.map(stat => (
              <div key={stat.type} className="p-3 rounded-lg border bg-card">
                <div className="text-sm font-medium capitalize">{stat.type}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span>{stat.pending} pending</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                    <span>{stat.running} running</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Tasks List */}
          {data?.tasks && data.tasks.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {data.tasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No active tasks
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TaskItem({ task }: { task: Task }) {
  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
    running: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    failed: <XCircle className="h-4 w-4 text-red-600" />,
    cancelled: <AlertCircle className="h-4 w-4 text-gray-600" />,
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {statusIcons[task.status]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium capitalize">{task.type}</span>
              <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {task.id}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(task.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
