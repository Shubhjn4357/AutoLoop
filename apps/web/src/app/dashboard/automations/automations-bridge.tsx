"use client";

import dynamic from "next/dynamic";
import { AutomationsSkeleton } from "@/components/dashboard/skeletons";

export const SimpleAutomationBuilder = dynamic(
  () => import("@/components/automation/simple-automation-builder").then(mod => mod.SimpleAutomationBuilder),
  {
    ssr: false,
    loading: () => <AutomationsSkeleton />
  }
);
