"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Smartphone, MessageCircle, Zap, Shield, Repeat, Users } from "lucide-react";

const FEATURES = [
  {
    title: "Instagram DMs",
    desc: "Automate every conversation with human-like intelligence.",
    icon: Smartphone,
    color: "bg-pink-500",
  },
  {
    title: "Smart Replies",
    desc: "Gemini-powered suggestions that close sales instantly.",
    icon: MessageCircle,
    color: "bg-blue-500",
  },
  {
    title: "Stateful Flows",
    desc: "Complex, multi-step sequences with wait & delay nodes.",
    icon: Repeat,
    color: "bg-emerald-500",
  },
  {
    title: "Lead Scoring",
    desc: "Automatically categorize and prioritize hot prospects.",
    icon: Users,
    color: "bg-amber-500",
  },
  {
    title: "Security First",
    desc: "Enterprise-grade encryption for all your social data.",
    icon: Shield,
    color: "bg-indigo-500",
  },
  {
    title: "Instant Triggers",
    desc: "Zero-latency responses to comments and mentions.",
    icon: Zap,
    color: "bg-yellow-500",
  },
];

export function HorizontalFeatures() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="absolute top-20 left-20">
          <h2 className="text-4xl font-black uppercase tracking-tighter opacity-10">Capabilities</h2>
        </div>
        
        <motion.div style={{ x }} className="flex gap-8 px-20">
          {FEATURES.map((feature, i) => (
            <div 
              key={i} 
              className="group relative flex-shrink-0 w-[400px] h-[500px] rounded-3xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm p-8 flex flex-col justify-end transition-all hover:border-primary/50"
            >
              <div className={`absolute top-8 left-8 size-16 rounded-2xl ${feature.color} bg-opacity-20 flex items-center justify-center text-white`}>
                <feature.icon className="size-8" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
              
              <div className="absolute bottom-0 right-0 p-8 text-8xl font-black opacity-5 group-hover:opacity-10 transition-opacity">
                0{i + 1}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
