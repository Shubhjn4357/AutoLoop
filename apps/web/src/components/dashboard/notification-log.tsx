import React, { useState } from "react";
import { formatDistanceToNowSimple } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notificationLogs } from "@/lib/db/schema";
import { deleteNotificationLog, clearNotificationLogs } from "@/lib/actions/automations";
import { Trash2, Trash, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";

type NotificationLogRow = typeof notificationLogs.$inferSelect;

const statusClasses: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export function NotificationLog({
  logs,
  title = "Notification Logs",
}: {
  logs: NotificationLogRow[];
  title?: string;
}) {
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearNotificationLogs();
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteNotificationLog(id);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Bell className="size-4 text-primary" />
          {title}
        </CardTitle>
        {logs.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl gap-2"
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearing}
          >
            {isClearing ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Bell className="size-6 text-muted-foreground opacity-20" />
            </div>
            <p className="text-sm text-muted-foreground font-medium italic">No automation events yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="group relative flex gap-4 rounded-2xl border border-border/40 p-4 transition-all hover:bg-muted/30 hover:border-border">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                    statusClasses[log.status] ?? statusClasses.info
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-bold text-foreground">{log.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">
                        {formatDistanceToNowSimple(log.createdAt)}
                      </span>
                      <button 
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-500 disabled:opacity-50"
                      >
                        {deletingId === log.id ? <Loader2 className="size-3 animate-spin" /> : <Trash className="size-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80 font-medium">
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AlertDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear notifications?"
        description="Are you sure you want to permanently clear all notifications? This action cannot be undone."
        actionText="Clear All"
        variant="destructive"
        onAction={handleClearAll}
      />
    </Card>
  );
}

