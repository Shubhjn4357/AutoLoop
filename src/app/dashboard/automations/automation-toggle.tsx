"use client";

import React, { useTransition, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleAutomation } from "@/lib/actions/automations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  initialStatus: boolean;
}

export function AutomationToggle({ id, initialStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(initialStatus);

  const handleToggle = (checked: boolean) => {
    // Optimistic UI
    setIsActive(checked);

    startTransition(async () => {
      try {
        await toggleAutomation(id, checked);
        toast.success(`Automation ${checked ? "activated" : "deactivated"}`);
      } catch {
        // Rollback on failure
        setIsActive(!checked);
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <Switch 
          checked={isActive} 
          onCheckedChange={handleToggle} 
          disabled={isPending}
        />
      )}
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-emerald-500" : "text-muted-foreground")}>
        {isActive ? "Active" : "Paused"}
      </span>
    </div>
  );
}
