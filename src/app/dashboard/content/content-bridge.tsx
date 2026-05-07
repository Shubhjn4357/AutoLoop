"use client";

import dynamic from "next/dynamic";
import { MediaGridSkeleton } from "@/components/dashboard/skeletons";

export const ContentDashboardClient = dynamic(
  () => import("./content-dashboard-client").then(mod => mod.ContentDashboardClient),
  {
    ssr: false,
    loading: () => <MediaGridSkeleton />
  }
);
