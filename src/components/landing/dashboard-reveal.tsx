"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function DashboardReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={containerRef} className="py-20 md:py-40 bg-background perspective-1000 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            A Dashboard from <br />
            <span className="text-primary italic">the Future.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Manage your entire social empire from a single, unified interface. 
            No more tab switching. No more manual tasks.
          </p>
        </div>

        <motion.div 
          style={{ scale, rotateX, opacity }}
          className="relative max-w-6xl mx-auto aspect-video rounded-[2rem] border border-primary/20 bg-card/50 overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]"
        >
          {/* Dashboard Placeholder - I'll use a gradient and some abstract shapes to make it look "premium" */}
          <div className="absolute inset-0 bg-gradient-to-br from-background to-card" />
          
          {/* Side Nav */}
          <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-border/50 flex flex-col items-center py-8 gap-8">
             <div className="size-10 rounded-xl bg-primary/20 animate-pulse" />
             <div className="size-10 rounded-xl bg-muted" />
             <div className="size-10 rounded-xl bg-muted" />
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-20 right-0 h-16 border-b border-border/50 flex items-center px-8">
             <div className="w-32 h-4 rounded-full bg-muted" />
          </div>

          {/* Main Content Area */}
          <div className="absolute top-16 left-20 right-0 bottom-0 p-8 grid grid-cols-3 gap-6">
             <div className="col-span-2 rounded-2xl bg-muted/20 border border-border/50 p-6">
                <div className="w-full h-8 rounded-lg bg-muted/40 mb-4" />
                <div className="space-y-4">
                   <div className="w-full h-24 rounded-xl bg-primary/5 border border-primary/10" />
                   <div className="w-full h-24 rounded-xl bg-muted/20" />
                </div>
             </div>
             <div className="rounded-2xl bg-muted/20 border border-border/50 p-6 flex flex-col gap-4">
                <div className="w-full h-40 rounded-xl bg-primary/10" />
                <div className="w-full h-20 rounded-xl bg-muted/40" />
             </div>
          </div>

          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
