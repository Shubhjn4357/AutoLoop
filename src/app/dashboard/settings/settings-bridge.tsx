"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const SettingsClient = dynamic(
  () => import("./settings-client").then(mod => mod.SettingsClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);
