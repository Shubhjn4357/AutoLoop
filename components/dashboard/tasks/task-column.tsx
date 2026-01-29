// default React import not required with new JSX transform
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "./task-card";
import { Task } from "@/types";

interface TaskColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  count: number;
  onControl?: (jobId: string, action: "pause" | "resume" | "stop") => void;
  onPriorityChange?: (taskId: string, priority: "low" | "medium" | "high") => void;
  onDelete?: (taskId: string, type: "scraping" | "workflow") => void;
  controllingTaskId?: string | null;
  contentClassName?: string;
}

export function TaskColumn({
  id,
  title,
  icon,
  tasks,
  count,
  onControl,
  onPriorityChange,
  onDelete,
  controllingTaskId,
  contentClassName,
}: TaskColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="space-y-4 bg-muted/40 p-4 rounded-xl min-h-[500px] border border-border/50 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground/90">
          <span className="bg-background p-2 rounded-md shadow-sm text-primary">
            {icon}
          </span>
          {title}
        </h3>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
          {count}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={`space-y-3 min-h-[100px] ${contentClassName || ""}`}>
          {tasks.map((task: Task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onControl={onControl}
              onPriorityChange={onPriorityChange}
              onDelete={onDelete}
              controllingTaskId={controllingTaskId}
            />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-background/50 rounded-lg border border-dashed border-border/60">
              <p className="text-sm font-medium">No tasks</p>
              <p className="text-xs opacity-70">Drag items here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
