import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pause, Play, StopCircle, Trash2 } from "lucide-react";
import { Task } from "@/types";

export const priorityColors: Record<string, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

interface TaskCardProps {
  task: Task;
  onControl?: (jobId: string, action: "pause" | "resume" | "stop") => void;
  onPriorityChange?: (taskId: string, priority: "low" | "medium" | "high") => void;
  onDelete?: (taskId: string, type: "scraping" | "workflow") => void;
  controllingTaskId?: string | null;
}

export function TaskCard({
  task,
  onControl,
  onPriorityChange,
  onDelete,
  controllingTaskId,
}: TaskCardProps) {
  const showControls = ["running", "processing", "paused", "pending", "in-progress"].includes(task.status);
  const isControlling = controllingTaskId === task.id;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: priorityColors[task.priority]?.replace("bg-", "") /* This is a hack, better to use proper colors */ }}>
       {/* Actually, let's just keep the original card style but enhance hover */}
       <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${priorityColors[task.priority]}`} />
       
      <CardContent className="p-4 space-y-3 relative pl-5"> 
      {/* Added pl-5 for the colored bar */}
      
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2 text-foreground">
              {task.title}
              {task.type === "workflow" && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Workflow</Badge>
              )}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted transition-colors px-2 py-0.5 h-6">
                <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]} mr-1.5`} />
                <span className="capitalize">{task.priority || "medium"}</span>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onPriorityChange?.(task.id, "low")}>
                <div className={`h-2 w-2 rounded-full ${priorityColors.low} mr-2`} />
                Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange?.(task.id, "medium")}>
                <div className={`h-2 w-2 rounded-full ${priorityColors.medium} mr-2`} />
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange?.(task.id, "high")}>
                <div className={`h-2 w-2 rounded-full ${priorityColors.high} mr-2`} />
                High
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-xs text-muted-foreground ml-auto">
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Action Bar - Reveals on Group Hover or if Controls Active? No, always visible for usability */}
        <div className="flex items-center justify-end gap-1 pt-2 border-t mt-2">
             {showControls && onControl && (
            <div className="flex gap-1">
              {(task.status === "in-progress" || task.status === "processing" || task.status === "running") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onControl(task.id, "pause")}
                  disabled={isControlling}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}

              {task.status === "paused" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onControl(task.id, "resume")}
                  disabled={isControlling}
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                  title="Resume"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onControl(task.id, "stop")}
                disabled={isControlling}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                title="Stop"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
            )}
            
            <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete?.(task.id, task.type || "scraping")}
                className="h-8 w-8 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-600 ml-1"
                title="Delete"
              >
              <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SortableTaskCard(props: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <TaskCard {...props} />
    </div>
  );
}
