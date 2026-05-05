import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-16 px-6">
      {/* Ambient background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <AnimatedButton variant="ghost" className="mb-8 rounded-full" disableGlow>
            <ArrowLeft className="mr-2 size-4" /> Back to Home
          </AnimatedButton>
        </Link>
        
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: April 28, 2025</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-foreground/80">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, connect your Instagram profile, or communicate with us. This includes your email address, name, and Instagram Business account identifiers (OAuth tokens).</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to operate, maintain, and provide the features and functionality of the AutoLoop service, specifically to process webhooks from Meta and dispatch automated replies on your behalf.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Data Retention and Deletion</h2>
              <p>We retain your data only for as long as necessary to provide you with our services. You can delete your account and all associated data at any time through your dashboard settings. We fully support Meta&apos;s Data Deletion callback requirements.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Information Sharing</h2>
              <p>We do not share your personal information or Instagram data with third parties except as necessary to provide our services (e.g., interacting with the Meta Graph API) or to comply with the law.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. OAuth tokens are securely encrypted.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:shubhamjain.com.in@gmail.com" className="text-primary hover:underline">shubhamjain.com.in@gmail.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
