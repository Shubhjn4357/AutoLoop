"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  variant = "primary",
  ...props
}: SwitchPrimitive.Root.Props & { variant?: "primary" | "secondary" }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 shadow-inner",
        variant === "primary"
          ? "data-[state=checked]:bg-linear-to-r data-[state=checked]:from-primary data-[state=checked]:to-fuchsia-500 data-[state=unchecked]:bg-muted/50"
          : "data-[state=checked]:bg-linear-to-r data-[state=checked]:from-secondary data-[state=checked]:to-indigo-500 data-[state=unchecked]:bg-muted/50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-all duration-200",
          "group-data-[state=checked]:translate-x-5 group-data-[state=unchecked]:translate-x-0.5",
          "group-data-[state=checked]:scale-110"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
