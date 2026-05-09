"use client";

import { ReactNode } from "react";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./auth-provider";
import { SocketProvider } from "./socket-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </SocketProvider>
      </AuthProvider>
      <Toaster />
    </>
  );
}
