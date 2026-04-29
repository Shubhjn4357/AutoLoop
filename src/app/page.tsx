import Link from "next/link";
import { ArrowRight, Bot, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <header className="flex h-16 shrink-0 items-center px-4 md:px-6 justify-between border-b dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            AutoLoop
          </span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 text-gray-700 dark:text-gray-300">
            Sign In
          </Link>
          <Link href="/login" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Get Started
          </Link>
        </nav>
      </header>
      
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900 dark:text-white">
                  Automate Instagram DMs like a Pro
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Connect your Instagram Business account to AutoLoop and set up powerful, event-driven automation rules.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-indigo-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  Start Automating Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-232 flex-col items-center space-y-4 text-center">
              <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl text-gray-900 dark:text-white">Features</h2>
              <p className="max-w-[85%] text-gray-500 sm:text-lg sm:leading-7 dark:text-gray-400">
                Everything you need to run your Instagram operation on autopilot.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-5xl md:grid-cols-3 mt-12">
              <div className="relative overflow-hidden rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-2 text-left">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Zap className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Fast Replies</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Respond to customer inquiries instantly 24/7 without delays.</p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-2 text-left">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Shield className="h-12 w-12 text-green-600 dark:text-green-400" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Secure API</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Built securely on top of the official Meta Graph API.</p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-2 text-left">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Bot className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Keyword Matching</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trigger flows based on exact or partial matches in DMs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-6 dark:border-gray-800">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row px-4 md:px-6 mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built for scale. Safe for Instagram Business.
          </p>
        </div>
      </footer>
    </div>
  );
}
