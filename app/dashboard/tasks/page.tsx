"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Clock, AlertCircle, Pause, Play, StopCircle, RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "processing" | "paused" | "failed" | "running";
  priority: "low" | "medium" | "high";
  type?: "scraping" | "workflow";
  businessesFound?: number;
  workflowName?: string;
  createdAt: Date;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [controllingTaskId, setControllingTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { get: getTasks, loading } = useApi<Task[]>();
  const { post: controlScraping } = useApi();
  const { patch: updateWorkflow } = useApi();

  // Fetch tasks function
  const fetchTasks = useCallback(async () => {
    setRefreshing(true);
    const data = await getTasks("/api/tasks");
    if (data) {
      setTasks(data);
    }
    setRefreshing(false);
  }, [getTasks]);

  // Initial fetch only
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleControl = async (taskId: string, action: "pause" | "resume" | "stop") => {
    setControllingTaskId(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let result;

      if (task.type === "workflow") {
        // Workflow Control
        const isActive = action === "resume"; // Resume = active, Pause/Stop = inactive
        result = await updateWorkflow(`/api/workflows/${taskId}`, {
          isActive
        });
      } else {
        // Scraping Control
        result = await controlScraping("/api/scraping/control", {
          jobId: taskId,
          action,
        });
      }

      if (result) {
        toast.success(`Task ${action}d successfully`);
        await fetchTasks();
      }
    } catch (error) {
      toast.error(`Failed to ${action} task`);
      console.error(`Error ${action}ing task:`, error);
    } finally {
      setControllingTaskId(null);
    }
  };

  const handlePriorityChange = async (taskId: string, priority: "low" | "medium" | "high") => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let result;

      if (task.type === "workflow") {
        result = await updateWorkflow(`/api/workflows/${taskId}`, {
          priority
        });
      } else {
        result = await controlScraping("/api/scraping/control", {
          jobId: taskId,
          action: "set-priority",
          priority
        });
      }

      if (result) {
        toast.success(`Priority updated to ${priority}`);
        await fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to update priority");
      console.error("Error updating priority:", error);
    }
  };

  // Removed local storage logic and manual task creation

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) =>
    t.status === "in-progress" ||
    t.status === "processing" ||
    t.status === "paused"
  );
  const completedTasks = tasks.filter((t) =>
    t.status === "completed" ||
    t.status === "failed"
  );

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  /* Drag and Drop State */
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px movement to start drag, allowing button clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks.find((t) => t.id === activeId);

    // Determine target column based on overId (which could be a task ID or column ID)
    let targetStatus: Task["status"] | null = null;

    if (overId === "pending-column" || overId === "in-progress-column" || overId === "completed-column") {
      targetStatus = overId === "pending-column" ? "pending" :
        overId === "in-progress-column" ? "in-progress" :
          "completed";
    } else {
      // Dropped over another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        // Map task status to column group
        if (overTask.status === "processing" || overTask.status === "paused" || overTask.status === "running") {
          targetStatus = "in-progress"; // Group these under in-progress
        } else {
          targetStatus = overTask.status;
        }
      }
    }

    if (activeTask && targetStatus && activeTask.status !== targetStatus) {
      // Handle status transition logic
      let action: "pause" | "resume" | "stop" | null = null;

      if (targetStatus === "in-progress") {
        // Pending -> In Progress (Resume/Start)
        if (activeTask.status === "pending" || activeTask.status === "paused") {
          action = "resume";
        }
      } else if (targetStatus === "completed" || targetStatus === "failed") {
        if (["processing", "running", "paused"].includes(activeTask.status)) {
          action = "stop";
        }
      }

      if (action) {
        await handleControl(activeId, action);
      } else if (targetStatus === "pending") {
        toast.info("Cannot move task back to pending once started");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Track your automated scraping and outreach jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTasks}
            variant="outline"
            disabled={refreshing || loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push("/dashboard/workflows?create=true")} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">Loading tasks...</div>
      ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-6 md:grid-cols-3">
              {/* Pending Column */}
              <SortableContext
                id="pending-column"
                items={pendingTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskColumn
                  id="pending-column"
                  title="Pending"
                  icon={<Clock className="h-5 w-5" />}
                  tasks={pendingTasks}
                  count={pendingTasks.length}
                  priorityColors={priorityColors}
                />
              </SortableContext>

              {/* In Progress Column */}
              <SortableContext
                id="in-progress-column"
                items={inProgressTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskColumn
                  id="in-progress-column"
                  title="In Progress"
                  icon={<AlertCircle className="h-5 w-5" />}
                  tasks={inProgressTasks}
                  count={inProgressTasks.length}
                  priorityColors={priorityColors}
                  onControl={handleControl}
                  controllingTaskId={controllingTaskId}
                />
              </SortableContext>

              {/* Completed Column */}
              <SortableContext
                id="completed-column"
                items={completedTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskColumn
                  id="completed-column"
                  title="Completed"
                  icon={<Check className="h-5 w-5" />}
                  tasks={completedTasks}
                  count={completedTasks.length}
                  priorityColors={priorityColors}
                />
              </SortableContext>
            </div>
            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  priorityColors={priorityColors}
                  // Hide controls during drag for cleaner look, or keep them
                  onControl={handleControl}
                  onPriorityChange={handlePriorityChange}
                  controllingTaskId={controllingTaskId}
                />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// Separate Column Component to handle dropping
interface TaskColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  count: number;
  priorityColors: Record<string, string>;
  onControl?: (jobId: string, action: "pause" | "resume" | "stop") => void;
  onPriorityChange?: (taskId: string, priority: "low" | "medium" | "high") => void;
  controllingTaskId?: string | null;
}

function TaskColumn({ id, title, icon, tasks, count, priorityColors, onControl, onPriorityChange, controllingTaskId }: TaskColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="space-y-4 bg-muted/50 p-4 rounded-lg min-h-[500px]">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        {icon}
        {title} ({count})
      </h3>
      <div className="space-y-3">
        {tasks.map((task: Task) => (
          <SortableTaskCard
            key={task.id}
            task={task}
            priorityColors={priorityColors}
            onControl={onControl}
            onPriorityChange={onPriorityChange}
            controllingTaskId={controllingTaskId}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  priorityColors: Record<string, string>;
  onControl?: (jobId: string, action: "pause" | "resume" | "stop") => void;
  onPriorityChange?: (taskId: string, priority: "low" | "medium" | "high") => void;
  controllingTaskId?: string | null;
}

function SortableTaskCard(props: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} />
    </div>
  );
}

function TaskCard({
  task,
  priorityColors,
  onControl,
  onPriorityChange,
  controllingTaskId,
}: {
  task: Task;
  priorityColors: Record<string, string>;
    onControl?: (jobId: string, action: "pause" | "resume" | "stop") => void;
    onPriorityChange?: (taskId: string, priority: "low" | "medium" | "high") => void;
    controllingTaskId?: string | null;
}) {
  const showControls = ["running", "processing", "paused", "pending", "in-progress"].includes(task.status);
  const isControlling = controllingTaskId === task.id;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              {task.title}
              {task.type === "workflow" && (
                <Badge variant="secondary" className="text-[10px] h-5">Workflow</Badge>
              )}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent transition-colors">
                <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]} mr-1`} />
                {task.priority || "medium"}
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

          <div className="text-xs text-muted-foreground">
            {new Date(task.createdAt).toLocaleDateString()}
          </div>

          {showControls && onControl && (
            <div className="ml-auto flex gap-2">
              {(task.status === "in-progress" || task.status === "processing" || task.status === "running") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(task.id, "pause")}
                  disabled={isControlling}
                  className="h-7 w-7 p-0"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}

              {task.status === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(task.id, "resume")}
                  disabled={isControlling}
                  className="h-7 w-7 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}

              {/* Stop Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onControl(task.id, "stop")}
                disabled={isControlling}
                className="text-red-500 hover:text-red-600 h-7 w-7 p-0"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
                 
            
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
