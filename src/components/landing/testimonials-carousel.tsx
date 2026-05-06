"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "E-commerce Founder",
    text: "AutoLoop changed our support game. We went from 24h response times to 2 seconds. The AI feels incredibly human.",
  },
  {
    name: "Marcus Thorne",
    role: "Agency Director",
    text: "The stateful flows are a masterpiece. We can now build complex sales funnels entirely within Instagram DMs.",
  },
  {
    name: "Elena Rodriguez",
    role: "Creator",
    text: "I was skeptical about AI, but the Gemini integration is flawless. It knows my brand voice better than I do!",
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Loved by <span className="text-primary italic">Modern</span> Businesses.
          </h2>
        </div>

        <div className="relative h-[400px] max-w-2xl mx-auto flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.1, x: -100 }}
              transition={{ duration: 0.6, ease: "anticipate" }}
              className="absolute inset-0 p-12 glass-card rounded-[3rem] border border-primary/20 flex flex-col items-center justify-center text-center shadow-2xl shadow-primary/10"
            >
              <Quote className="size-12 text-primary opacity-20 mb-8" />
              <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8 italic">
                "{TESTIMONIALS[index].text}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold">{TESTIMONIALS[index].name}</p>
                  <p className="text-sm text-muted-foreground">{TESTIMONIALS[index].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute -bottom-10 flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`size-2 rounded-full transition-all ${
                  index === i ? "w-8 bg-primary" : "bg-primary/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
