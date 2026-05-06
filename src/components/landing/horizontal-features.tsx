"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Smartphone, MessageCircle, Zap, Shield, Repeat, Users } from "lucide-react";

const FEATURES = [
  {
    title: "Instagram DMs",
    desc: "Automate every conversation with human-like intelligence.",
    icon: Smartphone,
    color: "from-pink-600/20 to-purple-600/20",
    image: "/feature_dm_automation_1778090636895.png",
  },
  {
    title: "Smart Replies",
    desc: "Gemini-powered suggestions that close sales instantly.",
    icon: MessageCircle,
    color: "from-blue-600/20 to-cyan-600/20",
    image: "/feature_analytics_1778090672938.png",
  },
  {
    title: "Stateful Flows",
    desc: "Complex, multi-step sequences with wait & delay nodes.",
    icon: Repeat,
    color: "from-emerald-600/20 to-teal-600/20",
    image: "/feature_flow_builder_1778090654025.png",
  },
  {
    title: "Lead Scoring",
    desc: "Automatically categorize and prioritize hot prospects.",
    icon: Users,
    color: "from-amber-600/20 to-orange-600/20",
    image: "/feature_dm_automation_1778090636895.png",
  },
  {
    title: "Security First",
    desc: "Enterprise-grade encryption for all your social data.",
    icon: Shield,
    color: "from-indigo-600/20 to-blue-600/20",
    image: "/feature_analytics_1778090672938.png",
  },
  {
    title: "Instant Triggers",
    desc: "Zero-latency responses to comments and mentions.",
    icon: Zap,
    color: "from-yellow-600/20 to-amber-600/20",
    image: "/feature_flow_builder_1778090654025.png",
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
        {/* Animated Background Decor */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 size-96 bg-fuchsia-500/5 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="absolute top-20 left-20 z-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-2"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-sm">Capabilities</span>
            <h2 className="text-7xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
              Future <br /> Proof.
            </h2>
          </motion.div>
        </div>
        
        <motion.div style={{ x }} className="flex gap-8 px-20">
          {FEATURES.map((feature, i) => (
            <div 
              key={i} 
              className="group relative flex-shrink-0 w-[450px] h-[550px] rounded-[2.5rem] overflow-hidden border border-border/50 bg-card/30 backdrop-blur-md p-10 flex flex-col justify-end transition-all hover:border-primary/50 shadow-2xl"
            >
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={feature.image} 
                  alt={feature.title} 
                  fill
                  className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700 group-hover:scale-110" 
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} via-card/80 to-card`} />
              </div>

              <div className="absolute top-10 left-10 size-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white z-10 shadow-lg">
                <feature.icon className="size-8 text-primary" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-4xl font-black mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {feature.desc}
                </p>
              </div>
              
              <div className="absolute top-10 right-10 text-6xl font-black opacity-5 group-hover:opacity-20 transition-all group-hover:translate-x-2">
                0{i + 1}
              </div>

              {/* Decorative Glow */}
              <div className="absolute -bottom-20 -right-20 size-64 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
