"use client";

import { motion } from "framer-motion";
import React from "react";

interface AnimatedContainerProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function AnimatedContainer({ 
  children, 
  delay = 0, 
  className = "",
  direction = "up" 
}: AnimatedContainerProps) {
  
  const getInitial = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: 20 };
      case "down": return { opacity: 0, y: -20 };
      case "left": return { opacity: 0, x: 20 };
      case "right": return { opacity: 0, x: -20 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
