export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: April 28, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>Welcome to AutoLoop (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Instagram automation service. Please read this policy carefully.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> When you sign in with Google or GitHub, we collect your name, email address, and profile picture.</li>
              <li><strong>Instagram Data:</strong> With your explicit authorization via Meta OAuth, we access your Instagram Business Account ID and Page ID to enable automation.</li>
              <li><strong>Message Metadata:</strong> We log incoming Instagram DM sender IDs and message text to enable keyword matching and automated replies.</li>
              <li><strong>Usage Data:</strong> We collect data about how you interact with our service, including automation rules created and messages processed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To authenticate you and maintain your session securely.</li>
              <li>To connect to and interact with your Instagram Business account via the official Meta Graph API.</li>
              <li>To match incoming messages against your configured automation rules and send replies on your behalf.</li>
              <li>To display analytics and message history in your dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Data Sharing</h2>
            <p>We do <strong>not</strong> sell, trade, or rent your personal information to third parties. We only share data with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Meta / Facebook:</strong> Strictly via the official Graph API to deliver automated messages on your behalf.</li>
              <li><strong>Turso (Database):</strong> Your data is stored in a secured, remote SQLite database hosted by Turso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data and message logs for as long as your account is active. You may request deletion at any time via our <a href="/user/delete" className="text-indigo-600 underline">Data Deletion page</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Security</h2>
            <p>We implement industry-standard security measures including HMAC SHA-256 webhook signature verification, OAuth 2.0 authentication, and encrypted database connections.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:shubhamjain.com.in@gmail.com" className="text-indigo-600 underline">shubhamjain.com.in@gmail.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
