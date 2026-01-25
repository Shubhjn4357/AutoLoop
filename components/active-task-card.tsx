"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, StopCircle, X } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";

interface ActiveTaskCardProps {
  jobId: string;
  workflowName: string;
  status: string;
  businessesFound?: number;
  onDismiss?: () => void;
  onStatusChange?: () => void;
}

export function ActiveTaskCard({
  jobId,
  workflowName,
  status,
  businessesFound = 0,
  onDismiss,
  onStatusChange,
}: ActiveTaskCardProps) {
  const [isControlling, setIsControlling] = useState(false);
  const { post: controlJob } = useApi();

  const handleControl = async (action: "pause" | "resume" | "stop") => {
    setIsControlling(true);
    try {
      const result = await controlJob("/api/scraping/control", {
        jobId,
        action,
      });

      if (result) {
        toast.success(`Task ${action}d successfully`);
        onStatusChange?.();
      } else {
        throw new Error("Failed to control task");
      }
    } catch (error) {
      toast.error(`Failed to ${action} task`);
      console.error(`Error ${action}ing task:`, error);
    } finally {
      setIsControlling(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "processing":
        return <Badge className="bg-blue-500">Running</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Stopped</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">Scraping: {workflowName}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {businessesFound} businesses found
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === "processing" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleControl("pause")}
                disabled={isControlling}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            {status === "paused" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleControl("resume")}
                disabled={isControlling}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {(status === "processing" || status === "paused") && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleControl("stop")}
                disabled={isControlling}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}

            {(status === "completed" || status === "failed") && onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
