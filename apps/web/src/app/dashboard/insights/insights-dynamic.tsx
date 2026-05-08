"use client";

import nextDynamic from "next/dynamic";
import React from "react";

const Loading = () => <div className="h-[300px] w-full animate-pulse bg-muted/50 rounded-xl" />;

export const InsightsCharts = nextDynamic(() => import("./insights-charts").then(mod => mod.InsightsCharts), {
  ssr: false,
  loading: Loading
});

export const AppInsightsData = nextDynamic(() => import("./app-insights-data").then(mod => mod.AppInsightsData), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/50 rounded-xl mt-6" />
});
