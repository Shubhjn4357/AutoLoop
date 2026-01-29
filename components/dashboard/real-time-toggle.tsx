"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AutoRefreshToggle() {
  const [enabled, setEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [enabled, router]);

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="auto-refresh" 
        checked={enabled} 
        onCheckedChange={setEnabled} 
        className="cursor-pointer"
      />
      <Label htmlFor="auto-refresh" className="flex items-center gap-1 cursor-pointer text-sm">
        {enabled && <RefreshCw className="h-3 w-3 animate-spin text-primary" />}
        Auto-Refresh
      </Label>
    </div>
  );
}
