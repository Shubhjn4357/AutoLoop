/**
 * Reusable Loading Skeleton Components
 * Provides consistent loading states across the application
 */

import React from "react";

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div 
              key={colIdx} 
              className="h-4 bg-muted rounded flex-1 animate-pulse"
              style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
      <div className="h-64 bg-muted rounded animate-pulse"></div>
      <div className="flex gap-4">
        <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
        <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
        <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
          <div className="h-10 w-10 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-32"></div>
        </div>
        <div className="h-10 w-10 bg-muted rounded-lg"></div>
      </div>
      <div className="mt-4 h-3 bg-muted rounded w-1/2"></div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex gap-3">
        <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page header */}
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main content */}
      <div className="rounded-lg border bg-card p-6">
        <TableSkeleton />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded"></div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <ChartSkeleton />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <ChartSkeleton />
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 bg-muted rounded w-1/4 mb-4 animate-pulse"></div>
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}

// Generic skeleton with custom content
export function Skeleton({ 
  className = "", 
  variant = "default" 
}: { 
  className?: string; 
  variant?: "default" | "circle" | "rectangle" 
}) {
  const baseClass = "bg-muted animate-pulse";
  const variantClass = {
    default: "rounded",
    circle: "rounded-full",
    rectangle: "rounded-lg",
  }[variant];
  
  return <div className={`${baseClass} ${variantClass} ${className}`} />;
}
