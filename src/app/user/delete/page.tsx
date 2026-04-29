export default async function UserDeletePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">

        {code ? (
          /* Status check view - Meta redirects here after deletion */
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deletion Request Received</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your data deletion request has been processed. All personal data associated with your account has been permanently removed from AutoLoop systems.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left border dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                Confirmation code: <span className="text-gray-700 dark:text-gray-300">{code}</span>
              </p>
            </div>
          </div>
        ) : (
          /* Informational view */
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Data Deletion</h1>
            <p className="text-gray-600 dark:text-gray-400">
              To delete all your AutoLoop data, you can disconnect AutoLoop from your Facebook settings. Meta will automatically notify us and we will permanently delete all associated data.
            </p>
            <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Steps to delete your data:</p>
              <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Go to your <strong>Facebook Settings</strong></li>
                <li>Click <strong>Apps and Websites</strong></li>
                <li>Find <strong>AutoLoop</strong> and click <strong>Remove</strong></li>
                <li>Select <strong>&quot;Also delete all data that [AutoLoop] has about you&quot;</strong></li>
              </ol>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Alternatively, email us at{" "}
              <a href="mailto:shubhamjain.com.in@gmail.com" className="text-indigo-600 underline">
                shubhamjain.com.in@gmail.com
              </a>{" "}
              with subject &quot;Data Deletion Request&quot; and we will process it within 30 days.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
