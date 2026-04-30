import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Clock3,
  GitBranch,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const heroImage =
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1800&q=80";

const featureCards = [
  {
    title: "Fast Replies",
    copy: "Reply from webhook events as soon as Meta delivers a DM.",
    icon: Zap,
    tone: "text-amber-600 bg-amber-100 dark:bg-amber-950/40",
  },
  {
    title: "Secure API",
    copy: "Uses OAuth, signed webhooks, and official Instagram Business APIs.",
    icon: Shield,
    tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40",
  },
  {
    title: "Keyword Matching",
    copy: "Match text, exact phrases, prefixes, suffixes, or regex rules.",
    icon: Bot,
    tone: "text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-950/40",
  },
];

const flowPreview = [
  {
    title: "Incoming DM",
    detail: "price details?",
    icon: MessageSquare,
    color: "text-blue-600",
  },
  {
    title: "Condition",
    detail: "contains price",
    icon: GitBranch,
    color: "text-fuchsia-600",
  },
  {
    title: "Auto message",
    detail: "sent through Graph API",
    icon: Bot,
    color: "text-emerald-600",
  },
  {
    title: "Follow-up",
    detail: "queued for later",
    icon: Clock3,
    color: "text-amber-600",
  },
  {
    title: "Log",
    detail: "notification persisted",
    icon: Bell,
    color: "text-rose-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
              <Bot className="size-5" />
            </span>
            <span className="text-xl font-semibold">AutoLoop</span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign In
            </Link>
            <Link href="/login" className={buttonVariants()}>
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[calc(100svh-8rem)] overflow-hidden">
          <Image
            src={heroImage}
            alt="Phone showing social media activity"
            fill
            priority
            unoptimized
            className="absolute inset-0 -z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-white/82 dark:bg-black/72" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.7fr)] lg:py-24">
            <div className="flex min-h-[520px] flex-col justify-center">
              <div className="mb-6 flex w-fit items-center gap-2 rounded-md border bg-background/80 px-3 py-2 text-sm font-medium backdrop-blur">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Real Meta webhooks, no simulated inbox
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                AutoLoop
              </h1>
              <p className="mt-5 max-w-2xl text-xl text-muted-foreground">
                Automate Instagram DMs like a Pro with official Instagram Business
                messaging, shared workflow state, signed webhooks, and follow-ups
                that run from your deployment.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className={buttonVariants({ size: "lg" })}>
                  Open Dashboard
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Check Connections
                </Link>
              </div>
            </div>

            <div className="self-center rounded-md border bg-background/88 p-4 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Live Flow</p>
                  <p className="text-xs text-muted-foreground">Webhook to follow-up</p>
                </div>
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Connected
                </span>
              </div>
              <div className="space-y-3">
                {flowPreview.map(({ title, detail, icon: Icon, color }) => (
                  <div key={title} className="flex items-center gap-3 rounded-md border bg-background p-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <Icon className={`size-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="truncate text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/35 py-12">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3 md:px-6">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-md border bg-background p-5">
                  <div className={cn("mb-5 flex size-10 items-center justify-center rounded-md", feature.tone)}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground md:px-6">
          <span>Built for Instagram Business workflows.</span>
          <span>Hugging Face Docker + Cloudflare Workers ready.</span>
        </div>
      </footer>
    </div>
  );
}
