"use client";

import * as React from "react";
import * as TabsPrim from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrim.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrim.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrim.List>
>(({ className, ...props }, ref) => (
  <TabsPrim.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrim.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrim.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrim.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrim.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm cursor-pointer",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrim.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrim.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrim.Content>
>(({ className, ...props }, ref) => (
  <TabsPrim.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrim.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
