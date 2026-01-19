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
} from "lucide-react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AutoLoop
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50 via-purple-50 to-background dark:from-blue-950/20 dark:via-purple-950/20 dark:to-background">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 h-72 w-72 animate-pulse-glow rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-40 right-10 h-96 w-96 animate-float rounded-full bg-purple-400/20 blur-3xl" />

        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated heading */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-slide-in-up opacity-0 stagger-1">
              <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Automate Your Cold Email Outreach
              </span>
              <br />
              <span className="mt-2 block">With AI-Powered Precision</span>
            </h1>

            {/* Animated description */}
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl animate-slide-in-up opacity-0 stagger-2">
              AutoLoop helps you find,qualify, and reach out to your ideal customers automatically.
              Powered by AI to generate personalized emails that convert.
            </p>

            {/* Animated features list */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3 animate-slide-in-up opacity-0 stagger-3">
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-4 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">AI-Powered Templates</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-4 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium">Smart Lead Scraping</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-4 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-sm font-medium">Advanced Analytics</span>
              </div>
            </div>

            {/* Animated CTA buttons */}
            <div className="mt-10 flex items-center justify-center gap-4 animate-slide-in-up opacity-0 stagger-4">
              <Link href="/auth/signin">
                <Button size="lg" className="gap-2 animate-pulse-glow">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
              Trusted by <span className="font-semibold text-foreground">1,000+</span> sales teams worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to scale outreach
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features to automate and personalize your cold email campaigns
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Auto Scraping</h3>
              <p className="text-muted-foreground">
                Continuously scrape Google Maps for businesses matching your criteria.
                Fresh leads delivered daily.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Personalization</h3>
              <p className="text-muted-foreground">
                Generate personalized emails using AI. Each message is tailored to the
                recipient&apos;s business.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Gmail Integration</h3>
              <p className="text-muted-foreground">
                Send emails directly from your Gmail account. Track opens, clicks, and
                responses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track campaign performance with detailed analytics and insights.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <CheckCircle2 className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Visual Workflows</h3>
              <p className="text-muted-foreground">
                Build complex automation workflows with an easy-to-use node editor.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group relative rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md stagger-item">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <Zap className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Smart Filtering</h3>
              <p className="text-muted-foreground">
                Filter leads based on criteria like website availability, ratings, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 py-24">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Ready to scale your outreach?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Join hundreds of businesses using AutoLoop to automate their cold email
            campaigns and close more deals.
          </p>
          <div className="mt-10">
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoLoop
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered cold email outreach automation that helps you scale your sales.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/feedback" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact & Feedback
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@autoloop.com" className="text-muted-foreground hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AutoLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
