"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  glowColor?: string;
  disableGlow?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, glowColor, disableGlow = false, ...props }, ref) => {
    return (
      <div className="relative inline-flex group">
        {!disableGlow && (
          <div
            className={cn(
              "absolute -inset-0.5 rounded-lg blur opacity-0 group-hover:opacity-40 transition duration-500",
              glowColor || "bg-primary"
            )}
          />
        )}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex"
        >
          <Button
            ref={ref}
            className={cn("transition-all duration-300", className)}
            {...props}
          />
        </motion.div>
      </div>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";
