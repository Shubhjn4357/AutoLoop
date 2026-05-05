"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export function NoConnectionBanner() {
  return (
    <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-4">
      <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
        <AlertTriangle className="size-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold">No Instagram Account Connected</h2>
      <p className="text-muted-foreground max-w-md">
        Connect your Instagram Business account in Settings to unlock real-time insights, content management, and automation features.
      </p>
      <Link href="/dashboard/settings">
        <AnimatedButton className="rounded-full px-8">
          Connect Instagram Account
        </AnimatedButton>
      </Link>
    </div>
  );
}
