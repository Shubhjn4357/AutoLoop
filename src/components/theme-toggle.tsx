"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="icon" aria-label="Theme">
        <Sun className="size-4" />
      </Button>
    );
  }

  const currentIndex = Math.max(
    0,
    themes.findIndex((item) => item.value === theme)
  );
  const current = themes[currentIndex];
  const Icon = current.icon;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Theme: ${current.label}`}
      title={`Theme: ${current.label}`}
      onClick={() => setTheme(themes[(currentIndex + 1) % themes.length].value)}
    >
      <Icon className="size-4" />
    </Button>
  );
}

