"use client";

import dynamic from "next/dynamic";

export const DashboardContent = dynamic(
  () => import("./dashboard-content").then(mod => mod.DashboardContent),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="col-span-1 lg:col-span-4 h-64 bg-muted rounded-xl" />
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  }
);
