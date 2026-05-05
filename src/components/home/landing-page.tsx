"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  GitBranch,
  MessageSquare,
  Shield,
  Zap,
  Bell,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    title: "Fast Replies",
    copy: "Reply from webhook events as soon as Meta delivers a DM.",
    icon: Zap,
    tone: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Secure API",
    copy: "Uses OAuth, signed webhooks, and official Instagram Business APIs.",
    icon: Shield,
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Keyword Matching",
    copy: "Match text, exact phrases, prefixes, suffixes, or regex rules.",
    icon: Bot,
    tone: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
  },
];

const flowPreview = [
  {
    title: "Incoming DM",
    detail: "price details?",
    icon: MessageSquare,
    color: "text-blue-500",
  },
  {
    title: "Condition",
    detail: "contains price",
    icon: GitBranch,
    color: "text-fuchsia-500",
  },
  {
    title: "Auto message",
    detail: "sent through Graph API",
    icon: Bot,
    color: "text-emerald-500",
  },
  {
    title: "Follow-up",
    detail: "queued for later",
    icon: Clock3,
    color: "text-amber-500",
  },
  {
    title: "Log",
    detail: "notification persisted",
    icon: Bell,
    color: "text-rose-500",
  },
];

export function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient glowing orb in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] -z-10 pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg transition-transform group-hover:scale-105">
              <Bot className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">AutoLoop</span>
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login">
              <AnimatedButton size="sm" className="rounded-full px-6">
                Get Started
                <ArrowRight className="size-4 ml-2" />
              </AnimatedButton>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[calc(100svh-8rem)] flex items-center pt-8 pb-16">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)] items-center">
            
            <motion.div 
              className="flex flex-col justify-center"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                <CheckCircle2 className="size-4 text-primary" />
                Real Meta webhooks, no simulated inbox
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="max-w-3xl text-5xl font-extrabold tracking-tight leading-[1.1] sm:text-6xl lg:text-7xl">
                Automate Instagram <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-fuchsia-500">DMs like a Pro.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Official Instagram Business messaging, shared workflow state, signed webhooks, and delayed follow-ups running completely autonomously.
              </motion.p>
              
              <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/login">
                  <AnimatedButton size="lg" className="w-full sm:w-auto rounded-full text-base h-12 px-8">
                    Open Dashboard
                    <ArrowRight className="size-4 ml-2" />
                  </AnimatedButton>
                </Link>
                <Link href="/dashboard/settings">
                  <AnimatedButton size="lg" variant="outline" disableGlow className="w-full sm:w-auto rounded-full text-base h-12 px-8 glass-card border-white/20 hover:bg-white/5">
                    Check Connections
                  </AnimatedButton>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="relative w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-fuchsia-500/20 blur-3xl -z-10 rounded-[3rem]" />
              <div className="glass-card rounded-3xl p-6 glow-ring overflow-hidden">
                <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Live Flow Preview</p>
                    <p className="text-xs text-muted-foreground">Webhook to follow-up</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Connected
                  </span>
                </div>
                <div className="space-y-3 relative">
                  <div className="absolute left-[1.15rem] top-8 bottom-8 w-[2px] bg-gradient-to-b from-blue-500/50 via-emerald-500/50 to-rose-500/50 -z-10" />
                  
                  {flowPreview.map(({ title, detail, icon: Icon, color }, idx) => (
                    <motion.div 
                      key={title} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      className="flex items-center gap-4 rounded-2xl border border-white/5 bg-background/50 p-3 backdrop-blur-md hover:bg-white/5 transition-colors"
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-md border border-white/5", color)}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="truncate text-xs text-muted-foreground">{detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        <section className="relative py-24 border-t border-border/50 bg-black/5 dark:bg-white/5">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for scale.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to automate Instagram DMs without the risk of shadowbans or rate limits.</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.article 
                    key={feature.title} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group glass-card rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300"
                  >
                    <div className={cn("mb-6 flex size-14 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110 duration-300", feature.tone)}>
                      <Icon className="size-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.copy}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/50">
        <div className="mx-auto flex flex-col md:flex-row max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground md:px-6 gap-4 text-center md:text-left">
          <span>&copy; {new Date().getFullYear()} AutoLoop. Built for Instagram Business.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
