"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <section ref={containerRef} className="relative h-[120vh] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <motion.div 
        style={{ y, scale, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[grid-white/[0.02]] bg-[size:40px_40px]" />
      </motion.div>

      <div className="container relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold mb-8"
        >
          <Sparkles className="size-3" />
          <span>Powered by Gemini 1.5 Flash</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
        >
          Automate Like <br />
          <span className="text-primary">Superpowers.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed"
        >
          The first AI-native social business suite. Build complex, multi-step 
          automations that feel human, scale infinitely, and close deals while you sleep.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 group">
            <Link href="/dashboard" className="flex items-center gap-2">
              Get Started Free 
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-primary/20 hover:bg-primary/5">
             Watch Demo
          </Button>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-[10%] hidden lg:block"
      >
        <div className="p-4 glass-card rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
           <div className="flex items-center gap-3 mb-2">
             <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
               <Sparkles className="size-4 text-primary" />
             </div>
             <p className="text-xs font-bold">AI Reply Generated</p>
           </div>
           <p className="text-[10px] text-muted-foreground">"Hey! I've analyzed your request..."</p>
        </div>
      </motion.div>
    </section>
  );
}
