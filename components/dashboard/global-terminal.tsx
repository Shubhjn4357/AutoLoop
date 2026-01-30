"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, X, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "error" | "warn" | "success";
  source: string;
  message: string;
}

export function GlobalTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Poll for logs from background tasks
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/logs/background");
        if (res.ok) {
          const data = await res.json();
          if (data.logs) {
            setLogs(data.logs);
          }
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    setLogs([]);
    fetch("/api/logs/background", { method: "DELETE" }).catch(console.error);
  };

  const handleDownloadLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autoloop-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "success":
        return "text-green-500";
      default:
        return "text-blue-500";
    }
  };

  const getLevelBadge = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "outline";
      case "success":
        return "default";
      default:
        return "secondary";
    }
  };

  const errorCount = logs.filter((l) => l.level === "error").length;
  const hasErrors = errorCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Background Task Terminal"
        >
          <TerminalIcon className={cn("h-4 w-4", hasErrors && "text-red-500")} />
          {logs.length > 0 && (
            <Badge
              variant={hasErrors ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center"
            >
              {logs.length > 99 ? "99+" : logs.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-[600px] p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Background Task Terminal</h3>
              {logs.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {logs.length} logs
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount} errors
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
                title="Download logs"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                title="Clear logs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Terminal Content */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground py-12">
                  <div className="text-center">
                    <TerminalIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No background task logs yet</p>
                    <p className="text-[10px] mt-1">
                      Logs will appear here as tasks run
                    </p>
                  </div>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant={getLevelBadge(log.level)}
                      className="h-4 px-1.5 text-[10px] shrink-0"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground shrink-0">
                      [{log.source}]
                    </span>
                    <span className={cn("break-all", getLevelColor(log.level))}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between p-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-3 w-3"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
            <span>Refreshes every 5s</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
