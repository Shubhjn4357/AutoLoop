"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkflowsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const getActiveTab = () => {
        if (pathname.includes("/executions")) return "executions";
        if (pathname.includes("/templates")) return "templates";
        return "my-workflows";
    };

    return (
        <div className="space-y-6">
            <Tabs value={getActiveTab()} onValueChange={(tab) => {
                if (tab === "my-workflows") router.push("/dashboard/workflows");
                if (tab === "templates") router.push("/dashboard/workflows/templates");
                if (tab === "executions") router.push("/dashboard/workflows/executions");
            }}>
                <TabsList>
                    <TabsTrigger value="my-workflows">My Workflows</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="executions">Executions</TabsTrigger>
                </TabsList>

                <TabsContent value="my-workflows" className="mt-6">
                    {pathname === "/dashboard/workflows" && children}
                </TabsContent>
                <TabsContent value="templates" className="mt-6">
                    {pathname.includes("/templates") && children}
                </TabsContent>
                <TabsContent value="executions" className="mt-6">
                    {pathname.includes("/executions") && children}
                </TabsContent>
            </Tabs>
        </div>
    );
}
