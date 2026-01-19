import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for AutoLoop - AI-powered cold email outreach automation platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 18, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using AutoLoop (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Description of Service</h2>
              <p>
                AutoLoop provides an AI-powered cold email outreach automation platform that enables users to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Scrape business information from Google Maps</li>
                <li>Generate personalized email templates using AI</li>
                <li>Automate email campaigns and sequences</li>
                <li>Track email performance and analytics</li>
                <li>Manage leads and business contacts</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comply with all applicable laws and regulations, including CAN-SPAM Act and GDPR</li>
                <li>Only send emails to businesses that have a legitimate interest in your services</li>
                <li>Include proper unsubscribe mechanisms in all emails</li>
                <li>Not use the Service for spam, harassment, or illegal activities</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Not attempt to reverse engineer or exploit the Service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Acceptable Use Policy</h2>
              <p>You may not use AutoLoop to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Send unsolicited commercial emails (spam)</li>
                <li>Harvest email addresses without consent</li>
                <li>Engage in phishing or fraudulent activities</li>
                <li>Distribute malware or malicious content</li>
                <li>Violate any person&apos;s privacy or intellectual property rights</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if we determine that you have violated these Terms of Service or engaged in fraudulent, abusive, or illegal activity. You may also terminate your account at any time through your account settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by AutoLoop and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any content you create using the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AutoLoop shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any bugs, viruses, or the like that may be transmitted to or through the Service</li>
                <li>Any errors or omissions in any content</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Data Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. Please review our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                to understand our practices.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AutoLoop operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="font-medium">
                Email: legal@autoloop.com<br />
                Website: https://autoloop.com
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              By using AutoLoop, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
