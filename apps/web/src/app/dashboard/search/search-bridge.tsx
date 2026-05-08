"use client";

import dynamic from "next/dynamic";

export const SearchResults = dynamic(
  () => import("./search-results").then(mod => mod.SearchResults),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted/40 rounded-3xl" />
  }
);
