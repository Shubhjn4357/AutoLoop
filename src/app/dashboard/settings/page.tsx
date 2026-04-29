import { db } from "@/lib/db/client";
import { instagramAccounts } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Bot, MessageCircle } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await db.query.instagramAccounts.findMany({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your connected accounts & preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="h-6 w-6 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Instagram Accounts</h3>
        </div>
        
        {accounts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <Bot className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">You haven&apos;t connected any Instagram accounts yet.</p>
            <form action="/api/instagram/connect" method="POST">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-colors">
                Connect Meta Account
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc: typeof instagramAccounts.$inferSelect) => (
              <div key={acc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Connected IG User ID: {acc.igUserId}</p>
                  <p className="text-sm text-gray-500">Page ID: {acc.pageId}</p>
                </div>
                <div className="text-green-600 font-medium text-sm border border-green-200 bg-green-50 px-2 py-1 rounded dark:bg-green-900/20 dark:border-green-800">
                  Active
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
