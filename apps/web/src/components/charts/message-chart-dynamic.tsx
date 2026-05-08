"use client";

import nextDynamic from "next/dynamic";
import React from "react";

const Loading = () => <div className="h-[300px] w-full animate-pulse bg-muted/50 rounded-xl" />;

export const MessageChart = nextDynamic(() => import("../message-chart").then(mod => mod.MessageChart), {
  ssr: false,
  loading: Loading
});
