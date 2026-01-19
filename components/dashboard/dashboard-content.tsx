"use client";

import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";
import { Navbar } from "./navbar";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div
            className={cn(
                "flex flex-1 flex-col overflow-hidden transition-all duration-300",
                isCollapsed ? "md:ml-16" : "md:ml-64"
            )}
        >
            <Navbar />
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}
