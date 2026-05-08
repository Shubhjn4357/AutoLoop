"use client";

import { ReactNode } from "react";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <SmoothScrollProvider>
        {children}
      </SmoothScrollProvider>
      <Toaster />
    </>
  );
}
