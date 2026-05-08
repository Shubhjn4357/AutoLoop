"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function InsightsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="glass-card lg:col-span-4">
          <CardHeader><div className="h-5 w-32 bg-muted rounded" /></CardHeader>
          <CardContent><div className="h-[300px] bg-muted/30 rounded-xl" /></CardContent>
        </Card>
        <Card className="glass-card lg:col-span-3">
          <CardHeader><div className="h-5 w-32 bg-muted rounded" /></CardHeader>
          <CardContent><div className="h-[300px] bg-muted/30 rounded-xl" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-muted/40" />
      ))}
    </div>
  );
}

export function AutomationSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted/60 rounded" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AutomationsSkeleton() {
  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted/40 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded-xl" />
        <div className="h-[500px] bg-muted/20 rounded-3xl" />
      </div>
    </div>
  );
}

