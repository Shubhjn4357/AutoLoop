"use client";

import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuyCoffeeWidget() {
  return (
    <div className="p-4 border-t mt-auto">
      <Button
        variant="outline"
        className="w-full justify-start gap-2 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-950/20 border-yellow-400"
        onClick={() => window.open("https://buymeacoffee.com/shubhjn", "_blank")}
      >
        <Coffee className="h-5 w-5 text-yellow-600" />
        <span className="text-sm font-medium">Support AutoLoop</span>
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Help keep this app running ☕
      </p>
    </div>
  );
}
