"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "next-themes";

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={(theme ?? "system") as ToasterProps["theme"]}
      richColors
      closeButton
      position="top-right"
      {...props}
    />
  );
}

