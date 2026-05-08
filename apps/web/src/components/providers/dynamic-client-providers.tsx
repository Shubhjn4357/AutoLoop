"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const ClientProviders = dynamic(() => import("./client-providers").then(mod => mod.ClientProviders), {
  ssr: false
});

export function DynamicClientProviders({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
