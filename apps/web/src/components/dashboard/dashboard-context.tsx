"use client";

import * as React from "react";

interface DashboardContextValue {
  userId: string;
  userName: string | null;
  userImage: string | null;
  connectionCount: number;
  latestNotificationStatus: string | null;
  recentLogs: {
    id: string;
    title: string;
    message: string;
    status: string;
    createdAt: Date;
  }[];
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (value: boolean) => void;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: Omit<DashboardContextValue, "isSidebarCollapsed" | "setIsSidebarCollapsed" | "isSearchOpen" | "setIsSearchOpen">;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <DashboardContext.Provider 
      value={{ 
        ...initialData, 
        isSidebarCollapsed, 
        setIsSidebarCollapsed,
        isSearchOpen,
        setIsSearchOpen
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used inside DashboardProvider");
  }
  return context;
}
