import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-16 px-6">
      {/* Ambient background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-500/10 blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <AnimatedButton variant="ghost" className="mb-8 rounded-full">
            <ArrowLeft className="mr-2 size-4" /> Back to Home
          </AnimatedButton>
        </Link>
        
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: April 28, 2025</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-foreground/80">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using AutoLoop, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
              <p>AutoLoop is an Instagram Direct Message automation platform that enables users to create keyword-based automation rules that trigger automated replies via the official Meta Graph API. The service operates through Meta-approved webhooks and OAuth connections.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Meta Platform Policy Compliance</h2>
              <p>You agree to comply with all applicable <a href="https://developers.facebook.com/policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta Platform Policies</a>, Instagram Community Guidelines, and Terms of Service when using AutoLoop. You are solely responsible for the content of automated messages sent through our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Prohibited Uses</h2>
              <p>You may not use AutoLoop to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Send spam or unsolicited messages.</li>
                <li>Violate any person&apos;s privacy or engage in harassment.</li>
                <li>Distribute illegal or harmful content.</li>
                <li>Circumvent Meta&apos;s rate limits or platform restrictions.</li>
                <li>Impersonate individuals or entities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Contact</h2>
              <p>For questions about these Terms, contact us at: <a href="mailto:shubhamjain.com.in@gmail.com" className="text-primary hover:underline">shubhamjain.com.in@gmail.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
