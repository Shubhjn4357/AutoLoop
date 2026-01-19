"use strict";
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Infinity, Github } from "lucide-react";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-200 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:mask-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <Card className="relative w-full max-w-md border-0 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-slate-950/70">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/50">
            <Infinity className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AutoLoop
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400">
              Automated Cold Email Intelligence
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          <div className="grid gap-4">
            <Button
              variant="outline"
              size="lg"
              className="relative h-12 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-50 transition-all hover:scale-[1.02] hover:shadow-md"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <div className="absolute left-4 flex h-6 w-6 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-222.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <span className="font-semibold">Continue with Google</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="relative h-12 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-50 transition-all hover:scale-[1.02] hover:shadow-md"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            >
              <div className="absolute left-4 flex h-6 w-6 items-center justify-center">
                <Github className="h-5 w-5" />
              </div>
              <span className="font-semibold">Continue with GitHub</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="text-center">
            <Button variant="link" asChild className="text-slate-500 dark:text-slate-400 font-normal hover:text-primary transition-colors">
              <Link href="/admin/login">Admin Access</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
            By clicking continue, you agree to our{" "}
            <Link href="#" className="font-medium text-primary hover:underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="font-medium text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
