export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Bot, CheckCircle2, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { isGoogleAuthConfigured, isGithubAuthConfigured } from "@/lib/auth/config";
import { LoginButtons } from "@/components/auth/login-buttons";

const loginImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80";

export default function LoginPage() {
  const googleConfigured = isGoogleAuthConfigured();
  const githubConfigured = isGithubAuthConfigured();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Image
        src={loginImage}
        alt="Workspace with connected devices"
        fill
        priority
        unoptimized
        className="absolute inset-0 -z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-white/86 dark:bg-black/72" />

      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
            <Bot className="size-5" />
          </span>
          <span className="text-xl font-semibold">AutoLoop</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,0.9fr)_390px]">
        <section>
          <div className="max-w-2xl">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-md border bg-background/85 px-3 py-2 text-sm font-medium backdrop-blur">
              <ShieldCheck className="size-4 text-emerald-600" />
              Secure multi-provider authentication
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
              Sign in and keep every automation connected.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Your dashboard shares account status, workflow rules, delivery logs,
              and follow-up queues across the app after login.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {["OAuth 2.0", "Secure Sessions", "Encrypted Webhooks", "Turso DB"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md border bg-background/80 p-3 text-sm backdrop-blur">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <Card className="bg-background/90 shadow-2xl backdrop-blur">
          <CardHeader>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
            <CardDescription>Choose your preferred provider to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginButtons 
              googleConfigured={googleConfigured} 
              githubConfigured={githubConfigured} 
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

