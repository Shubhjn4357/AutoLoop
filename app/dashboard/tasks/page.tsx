"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertCircle, Check, RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
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
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TaskColumn } from "@/components/dashboard/tasks/task-column";
import { TaskCard } from "@/components/dashboard/tasks/task-card";
import { Task } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [controllingTaskId, setControllingTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string, type: "scraping" | "workflow" } | null>(null);

  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const router = useRouter();

  const { get: getTasks, loading } = useApi<Task[]>();
  const { post: controlScraping } = useApi();
  const { patch: updateWorkflow } = useApi();
  const { del: deleteTask } = useApi();

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
      } else {
        throw new Error("API returned null");
      }
    } catch (error) {
      toast.error(`Failed to ${action} task`);
      console.error(`Error ${action}ing task:`, error);
    } finally {
      setControllingTaskId(null);
    }
  };

  const handleControlRequest = (taskId: string, action: "pause" | "resume" | "stop") => {
    if (action === "stop") {
      setConfirmStopId(taskId);
    } else {
      handleControl(taskId, action);
    }
  };

  const handlePriorityChange = async (taskId: string, priority: "low" | "medium" | "high") => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t));

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
        // No need to fetch if optimistic update matches, but safe to fetch
        // await fetchTasks(); 
      } else {
        throw new Error("API returned null");
      }
    } catch (error) {
      toast.error("Failed to update priority");
      console.error("Error updating priority:", error);
      // Revert optimistic update
      await fetchTasks();
    }
  };

  const handleDeleteRequest = (taskId: string, type: "scraping" | "workflow" = "scraping") => {
    setConfirmDeleteId({ id: taskId, type });
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      const result = await deleteTask(`/api/tasks?id=${confirmDeleteId.id}&type=${confirmDeleteId.type}`);
      if (result !== null) {
        toast.success("Task deleted successfully");
        await fetchTasks();
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (error) {
      toast.error("Failed to delete task");
      console.error("Error deleting task:", error);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) =>
    t.status === "in-progress" ||
    t.status === "processing" ||
    t.status === "paused" ||
    t.status === "running"
  );
  const completedTasks = tasks.filter((t) =>
    t.status === "completed" ||
    t.status === "failed"
  );

  /* Drag and Drop State */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    // Determine target column based on overId
    let targetStatus: Task["status"] | null = null;

    if (overId === "pending-column" || overId === "in-progress-column" || overId === "completed-column") {
      targetStatus = overId === "pending-column" ? "pending" :
        overId === "in-progress-column" ? "in-progress" :
          "completed";
    } else {
      // Dropped over another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        if (overTask.status === "processing" || overTask.status === "paused" || overTask.status === "running") {
          targetStatus = "in-progress"; 
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
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">Task Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your automated scraping and outreach jobs
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchTasks}
            variant="outline"
            disabled={refreshing || loading}
            className="w-full sm:w-auto shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push("/dashboard/workflows?create=true")} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-6 md:grid-cols-3 h-full">
              {/* Pending Column */}
              <TaskColumn
                id="pending-column"
                title="Pending"
                icon={<Clock className="h-5 w-5 text-pending-foreground" />}
                tasks={pendingTasks}
                count={pendingTasks.length}
                onControl={handleControlRequest}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteRequest}
                controllingTaskId={controllingTaskId}
              />

              {/* In Progress Column */}
              <TaskColumn
                id="in-progress-column"
                title="In Progress"
                icon={<AlertCircle className="h-5 w-5 text-blue-500" />}
                tasks={inProgressTasks}
                count={inProgressTasks.length}
                onControl={handleControlRequest}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteRequest}
                controllingTaskId={controllingTaskId}
                contentClassName="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
              />

              {/* Completed Column */}
              <TaskColumn
                id="completed-column"
                title="Completed"
                icon={<Check className="h-5 w-5 text-green-500" />}
                tasks={completedTasks}
                count={completedTasks.length}
                onControl={handleControlRequest}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteRequest}
                controllingTaskId={controllingTaskId}
              />
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  onControl={handleControl}
                  onPriorityChange={handlePriorityChange}
                  controllingTaskId={controllingTaskId}
                />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ConfirmDialog
        open={!!confirmStopId}
        onOpenChange={(open) => !open && setConfirmStopId(null)}
        title="Stop Task?"
        description="Are you sure you want to stop this task? This action cannot be undone and the task will be marked as failed/stopped."
        confirmText="Stop Task"
        onConfirm={() => {
          if (confirmStopId) handleControl(confirmStopId, "stop");
          setConfirmStopId(null);
        }}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete Task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
