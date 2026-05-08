"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-48 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted/60 rounded" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div className="h-10 w-full bg-muted/20 rounded-xl" />
                <div className="h-10 w-full bg-muted/20 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
