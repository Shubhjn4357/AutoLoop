"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { useDashboardContext } from "@/components/dashboard/dashboard-context";

export function ConnectionStatus() {
  const { connectionCount } = useDashboardContext();
  const isConnected = connectionCount > 0;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs font-medium">
      {isConnected ? (
        <CheckCircle2 className="size-3.5 text-green-600" />
      ) : (
        <CircleAlert className="size-3.5 text-amber-600" />
      )}
      <span>{isConnected ? "Instagram connected" : "No Instagram connection"}</span>
    </div>
  );
}

