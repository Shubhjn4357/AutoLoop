import { HeroSection } from "@/components/landing/hero-section";
import { DashboardReveal } from "@/components/landing/dashboard-reveal";
import { HorizontalFeatures } from "@/components/landing/horizontal-features";
import { TestimonialsCarousel } from "@/components/landing/testimonials-carousel";
import { ImmersiveContact } from "@/components/landing/immersive-contact";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground relative">
      {/* Global Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] size-[600px] bg-primary/5 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-fuchsia-500/5 blur-[180px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 glass-card rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
          <Link href="/" className="text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
            Auto<span className="text-primary">Loop</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-bold">Sign In</Link>
            <Button className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Product Reveal */}
      <DashboardReveal />

      {/* Horizontal Scroll Features */}
      <div id="features">
        <HorizontalFeatures />
      </div>

      {/* Testimonials */}
      <div id="testimonials">
        <TestimonialsCarousel />
      </div>

      {/* Contact Form */}
      <div id="contact">
        <ImmersiveContact />
      </div>

      {/* Footer */}
      <footer className="py-20 border-t border-border/50 text-center">
        <div className="container px-4">
          <p className="text-2xl font-black tracking-tighter mb-4">Auto<span className="text-primary">Loop</span></p>
          <p className="text-sm text-muted-foreground">
            © 2026 AutoLoop Business Suite. All rights reserved. <br />
            Built with ❤️ and Gemini 1.5 Flash.
          </p>
        </div>
      </footer>
    </main>
  );
}
