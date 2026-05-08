"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginButtons } from "./login-buttons";
import { Bot } from "lucide-react";

interface LoginFormProps {
  googleConfigured: boolean;
  githubConfigured: boolean;
}

export function LoginForm({ googleConfigured, githubConfigured }: LoginFormProps) {
  return (
    <Card className="glass-card glow-ring">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <Bot className="size-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your AutoLoop account to manage your Instagram automations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LoginButtons googleConfigured={googleConfigured} githubConfigured={githubConfigured} />
        <div className="text-center text-xs text-muted-foreground mt-4">
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline hover:text-primary">Terms of Service</a> and{" "}
          <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
        </div>
      </CardContent>
    </Card>
  );
}
