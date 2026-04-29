export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: April 28, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using AutoLoop, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>AutoLoop is an Instagram Direct Message automation platform that enables users to create keyword-based automation rules that trigger automated replies via the official Meta Graph API. The service operates through Meta-approved webhooks and OAuth connections.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Meta Platform Policy Compliance</h2>
            <p>You agree to comply with all applicable <a href="https://developers.facebook.com/policy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Meta Platform Policies</a>, Instagram Community Guidelines, and Terms of Service when using AutoLoop. You are solely responsible for the content of automated messages sent through our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Prohibited Uses</h2>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You must immediately notify us of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Service Availability</h2>
            <p>AutoLoop is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free operation, particularly as service functionality depends on the availability of the Meta Graph API.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Termination</h2>
            <p>We reserve the right to terminate or suspend access to our service immediately, without prior notice, for conduct that violates these Terms or is harmful to other users, us, or third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
            <p>AutoLoop shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:shubhamjain.com.in@gmail.com" className="text-indigo-600 underline">shubhamjain.com.in@gmail.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
