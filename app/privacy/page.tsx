import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for AutoLoop - Learn how we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: January 18, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introduction</h2>
              <p>
                At AutoLoop (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password</li>
                <li><strong>Profile Information:</strong> Company name, job title, preferences</li>
                <li><strong>Business Data:</strong> Contact lists, email templates, campaign data</li>
                <li><strong>Payment Information:</strong> Billing details (processed securely through third-party providers)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Cookies:</strong> Session tokens, preferences, analytics data</li>
                <li><strong>Email Analytics:</strong> Open rates, click rates, bounce rates</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain our service</li>
                <li>Process your transactions and manage your account</li>
                <li>Send automated emails on your behalf</li>
                <li>Analyze and improve our service performance</li>
                <li>Communicate with you about updates, support, and marketing</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your data with:</p>
              
              <h3 className="text-xl font-semibold">4.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email delivery services (e.g., SendGrid, Resend)</li>
                <li>Cloud hosting providers (e.g., Vercel, AWS)</li>
                <li>Analytics providers (e.g., Google Analytics)</li>
                <li>Payment processors (e.g., Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">4.2 Legal Requirements</h3>
              <p>
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.3 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit (SSL/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure backup systems</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. You may request deletion of your account at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact us at privacy@autoloop.com
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain your session and preferences</li>
                <li>Analyze service usage and performance</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="mt-2">
                You can control cookies through your browser settings. Disabling cookies may limit some functionality of our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Third-Party Links</h2>
              <p>
                Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Children&apos;s Privacy</h2>
              <p>
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. GDPR Compliance</h2>
              <p>
                For users in the European Economic Area (EEA), we process your data in accordance with GDPR requirements. Our lawful basis for processing includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contract performance (to provide our service)</li>
                <li>Legitimate interests (to improve and secure our service)</li>
                <li>Consent (for marketing communications)</li>
                <li>Legal obligations (to comply with applicable laws)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. California Privacy Rights (CCPA)</h2>
              <p>
                California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, sold, or disclosed, and the right to opt-out of the sale of personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">15. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="font-medium space-y-1">
                <p>Email: privacy@autoloop.com</p>
                <p>Address: [Your Company Address]</p>
                <p>Website: https://autoloop.com</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              By using AutoLoop, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
