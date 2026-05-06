"use client";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="size-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mb-8">
        <AlertCircle className="size-10" />
      </div>
      
      <h2 className="text-3xl font-black tracking-tighter mb-4">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We encountered an error while loading your dashboard. This might be due to a temporary database connection issue.
        {error.digest && <span className="block mt-2 font-mono text-xs opacity-50">Error ID: {error.digest}</span>}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()} className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
          <RefreshCcw className="size-4 mr-2" />
          Try Again
        </Button>
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl px-8 h-12 flex items-center justify-center font-bold")}
        >
          Back to Landing
        </Link>
      </div>
      
      <div className="mt-12 p-4 bg-muted/30 rounded-2xl border border-border/50 text-left max-w-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Troubleshooting</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Check if TURSO_DATABASE_URL is set correctly in your environment.</li>
          <li>Ensure your database token is valid and not expired.</li>
          <li>Verify your internet connection and try refreshing.</li>
        </ul>
      </div>
    </div>
  );
}
