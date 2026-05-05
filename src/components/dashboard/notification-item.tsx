import { formatDistanceToNow } from "date-fns";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: Date;
}

export function NotificationItem({ log }: { log: NotificationLog }) {
  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[log.status as "success" | "error" | "warning" | "info"] || Info;

  const colorClass = {
    success: "text-emerald-500 bg-emerald-500/10",
    error: "text-rose-500 bg-rose-500/10",
    warning: "text-amber-500 bg-amber-500/10",
    info: "text-blue-500 bg-blue-500/10",
  }[log.status as "success" | "error" | "warning" | "info"] || "text-blue-500 bg-blue-500/10";

  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">{log.title}</p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {log.message}
        </p>
      </div>
    </div>
  );
}
