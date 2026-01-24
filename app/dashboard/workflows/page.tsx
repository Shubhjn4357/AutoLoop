"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, PenSquare } from "lucide-react";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";
import { useRouter } from "next/navigation";

export default function WorkflowsPage() {
  const { workflows, refetch } = useWorkflows();
  const { toast } = useToast();
  const router = useRouter();
  const { patch: updateWf, del: deleteWfFn, loading } = useApi();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Workflows</h1>
          <p className="text-muted-foreground">
            Manage your email automation workflows
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/workflows/builder/new")}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ||workflows.length === 0 ? (
          // Show skeleton cards while loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="group cursor-pointer hover:shadow-lg transition-all" onClick={() => router.push(`/dashboard/workflows/builder/${workflow.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{workflow.name}</CardTitle>
                  <Badge variant={workflow.isActive ? "success" : "secondary"}>
                    {workflow.isActive ? "Running" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {workflow.targetBusinessType}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {workflow.keywords.slice(0, 3).map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {workflow.keywords.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{workflow.keywords.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity justify-end">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      const toggleStatus = async () => {
                        const result = await updateWf(`/api/workflows/${workflow.id}`, { isActive: !workflow.isActive });

                        if (result) {
                          refetch();
                          toast({
                            title: "Status Updated",
                            description: `Workflow ${!workflow.isActive ? "resumed" : "paused"}`,
                          })
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to update status",
                            variant: "destructive",
                          })
                        }
                      };
                      toggleStatus();
                    }}
                  >
                    {workflow.isActive ? (
                      <div className="h-3 w-3 bg-red-500 rounded-sm" />
                    ) : (
                      <Play className="h-4 w-4 text-green-500 fill-green-500" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/workflows/builder/${workflow.id}`);
                    }}
                    className="hover:scale-105 transition-transform"
                  >
                    <PenSquare className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm("Are you sure you want to delete this workflow?")) return;

                      const deleteWorkflow = async () => {
                        const result = await deleteWfFn(`/api/workflows/${workflow.id}`);

                        if (result !== null) {
                          refetch();
                          toast({ title: "Workflow Deleted", description: "Workflow deleted successfully" })
                        } else {
                          toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" })
                        }
                      };
                      deleteWorkflow();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {workflows.length === 0 && !loading && (
          <Card className="col-span-full border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No workflows yet</p>
              <Button
                onClick={() => router.push("/dashboard/workflows/builder/new")}
              >
                Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
