"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Bot,
  Mail,
  BarChart3,
  CheckCircle2,
  Users,
  Layers,
} from "lucide-react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (session?.user) router.push("/dashboard");
  }, [session, router]);

  // Lightweight parallax scroll handler
  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver to trigger entrance animations for elements with .animate-on-scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(".animate-on-scroll"));
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("animate-slide-in-up");
            el.classList.remove("opacity-0");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => {
      el.classList.add("opacity-0");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-b from-background via-muted/30 to-background">
      {/* Top nav */}
      <nav className="fixed left-0 right-0 top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-extrabold bg-linear-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AutoLoop
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with modern gradients */}
      <header className="relative pt-32 pb-24">
        {/* Modern gradient blobs */}
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-[-10%] top-10 h-[400px] w-[400px] rounded-full bg-linear-to-r from-primary/30 to-purple-500/30 opacity-40 blur-3xl animate-pulse"
            style={{ transform: `translateY(${offset * -0.02}px)`, animationDuration: '4s' }}
          />
          <div
            className="absolute right-[-12%] top-32 h-[500px] w-[500px] rounded-full bg-linear-to-r from-pink-500/30 to-purple-600/30 opacity-40 blur-3xl animate-pulse"
            style={{ transform: `translateY(${offset * -0.04}px)`, animationDuration: '6s', animationDelay: '1s' }}
          />
          <div
            className="absolute left-1/2 top-[50%] h-[300px] w-[800px] -translate-x-1/2 rounded-3xl bg-linear-to-r from-emerald-400/20 to-cyan-400/20 opacity-30 blur-2xl"
            style={{ transform: `translate(-50%, ${offset * -0.01}px)` }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                Trusted by 1,200+ sales teams
              </div>

              <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl bg-linear-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                Automate outreach.<br />Personalize at scale.
              </h1>

              <p className="mt-4 mx-auto max-w-3xl text-lg text-muted-foreground leading-relaxed">
                AutoLoop finds leads, enriches profiles, and sends AI-personalized cold
                emails — all while you focus on closing deals. Powerful integrations,
                visual workflows, and enterprise-grade reliability.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 text-base px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="border-2 text-base px-8">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features overview */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-4xl font-bold bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Complete outreach stack
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to source prospects, personalize at scale, and
              measure impact — built for SDRs and growth teams.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay={0.05}
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Auto Scraping & Enrichment"
              description="Continuously discover leads from Google Maps, websites, and social profiles, then enrich records with firmographics and contact data."
            />

            <FeatureCard
              delay={0.1}
              icon={<Bot className="h-6 w-6 text-purple-600" />}
              title="AI Personalization"
              description="Generate personalized, context-aware email copy for each lead using AI tuned for cold outreach. A/B test variations automatically."
            />

            <FeatureCard
              delay={0.15}
              icon={<Mail className="h-6 w-6 text-emerald-600" />}
              title="Gmail & SMTP Integration"
              description="Send from your Gmail or SMTP provider, track opens/clicks, and record replies in one place. Automatic send throttling and warm-up support."
            />

            <FeatureCard
              delay={0.2}
              icon={<BarChart3 className="h-6 w-6 text-pink-600" />}
              title="Analytics & Insights"
              description="Campaign-level analytics, funnel metrics, and recipient-level signals to help you optimize subject lines and sequences."
            />

            <FeatureCard
              delay={0.25}
              icon={<Layers className="h-6 w-6 text-amber-600" />}
              title="Visual Workflows"
              description="Build multi-step automations with a drag-and-drop node editor (scrape → enrich → sequence → notify)."
            />

            <FeatureCard
              delay={0.3}
              icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
              title="Deliverability & Safety"
              description="Built-in rate limiting, spam-safety checks, unsubscribe handling, and per-account quotas to protect sender reputation."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h3 className="text-3xl font-bold">How AutoLoop works</h3>
              <ol className="mt-8 space-y-6 list-decimal pl-6 text-muted-foreground">
                <li className="pl-2">
                  <strong className="text-foreground">Find</strong>: Define search criteria and AutoLoop continuously
                  finds new prospects.
                </li>
                <li className="pl-2">
                  <strong className="text-foreground">Enrich</strong>: We append contact details, role, and business
                  data for better personalization.
                </li>
                <li className="pl-2">
                  <strong className="text-foreground">Personalize</strong>: AI crafts tailored outreach using the
                  lead context and your templates.
                </li>
                <li className="pl-2">
                  <strong className="text-foreground">Send & Measure</strong>: Deliver through Gmail/SMTP and
                  measure opens, clicks and replies. Iterate automatically.
                </li>
              </ol>
            </div>

            <div>
              <div className="rounded-xl border bg-card p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-6 flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Customers</div>
                    <div className="text-2xl font-bold">1,200+ teams</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  AutoLoop runs continuously in the background and surfaces only the
                  leads that match your ideal customer profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials + CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-bold">What customers say</h2>
            <p className="mt-3 text-muted-foreground">Real teams, real results.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <blockquote className="rounded-lg border bg-card p-6 shadow hover:shadow-lg transition-shadow">
              <p className="text-foreground">&ldquo;AutoLoop doubled our booked demos in 6 weeks.&rdquo;</p>
              <footer className="mt-4 text-sm text-muted-foreground">— Head of Sales, SMB</footer>
            </blockquote>

            <blockquote className="rounded-lg border bg-card p-6 shadow hover:shadow-lg transition-shadow">
              <p className="text-foreground">&ldquo;The AI emails feel human and convert better than our manual outreach.&rdquo;</p>
              <footer className="mt-4 text-sm text-muted-foreground">— Growth Lead</footer>
            </blockquote>

            <blockquote className="rounded-lg border bg-card p-6 shadow hover:shadow-lg transition-shadow">
              <p className="text-foreground">&ldquo;Workflows let us automate complex sequences without engineering.&rdquo;</p>
              <footer className="mt-4 text-sm text-muted-foreground">— Ops Manager</footer>
            </blockquote>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8">
                Start Free Trial
                <Zap className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AutoLoop — Privacy · Terms
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <div
      className="group rounded-xl border bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1 animate-on-scroll"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">{icon}</div>
      <h4 className="mb-2 text-lg font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
