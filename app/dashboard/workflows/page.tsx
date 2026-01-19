"use client";

import { useState } from "react";
import { Node, Edge } from "reactflow";
import { NodeEditor, NodeData } from "@/components/node-editor/node-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AutomationWorkflow } from "@/types";
import { Plus, Play, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";

export default function WorkflowsPage() {
  const { workflows, refetch } = useWorkflows();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Partial<AutomationWorkflow> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { post: createWf, patch: updateWf, del: deleteWfFn, loading } = useApi();

  const handleSave = async (nodes?: Node<NodeData>[], edges?: Edge[]) => {
    console.log("🚀 Saving workflow");
    if (!selectedWorkflow) return;

    const workflowData = {
      ...selectedWorkflow,
      nodes: nodes || selectedWorkflow.nodes,
      edges: edges || selectedWorkflow.edges,
    };

    const isUpdate = !!selectedWorkflow.id;
    let success = false;

    if (isUpdate && selectedWorkflow.id) {
      const result = await updateWf(`/api/workflows/${selectedWorkflow.id}`, workflowData);
      success = !!result;
    } else {
      const result = await createWf("/api/workflows", workflowData);
      success = !!result;
    }

    if (success) {
      await refetch();
      toast({
        title: "Success",
        description: `Workflow ${isUpdate ? "updated" : "created"} successfully`,
      });
      if (!isUpdate) {
        setIsCreating(false);
        setSelectedWorkflow(null);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Workflows</h1>
          <p className="text-muted-foreground">
            Build visual workflows for your email automation
          </p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => {
              setSelectedWorkflow({ nodes: [], edges: [] });
              setIsCreating(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => handleSave()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Workflow"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setSelectedWorkflow(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  placeholder="My Workflow"
                  value={selectedWorkflow?.name || ""}
                  onChange={(e) =>
                    setSelectedWorkflow({
                      ...selectedWorkflow,
                      name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Target Business Type</label>
                  <Input
                    placeholder="e.g., Restaurants"
                    value={selectedWorkflow?.targetBusinessType || ""}
                    onChange={(e) =>
                      setSelectedWorkflow({
                        ...selectedWorkflow,
                        targetBusinessType: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Keywords</label>
                  <Input
                    placeholder="restaurant, cafe, bar"
                    value={selectedWorkflow?.keywords?.join(", ") || ""}
                    onChange={(e) =>
                      setSelectedWorkflow({
                        ...selectedWorkflow,
                        keywords: e.target.value.split(",").map((k) => k.trim()),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="h-[600px] border rounded-lg overflow-hidden">
            <NodeEditor
              initialNodes={(selectedWorkflow?.nodes as Node<NodeData>[]) || []}
              initialEdges={(selectedWorkflow?.edges as Edge[]) || []}
              onSave={(nodes: Node<NodeData>[], edges: Edge[]) => {
                handleSave(nodes, edges);
              }}
              isSaving={loading}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                    <div className="flex gap-2 justify-between">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              workflows.map((workflow) => (
            <Card key={workflow.id} className="group cursor-pointer hover:shadow-lg transition-all">
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
                      setSelectedWorkflow(workflow);
                      setIsCreating(true);
                    }}
                        className="hover:scale-105 transition-transform"
                  >
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
              )))}
          {workflows.length === 0 && (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No workflows yet</p>
                <Button
                  onClick={() => {
                    setSelectedWorkflow({ nodes: [], edges: [] });
                    setIsCreating(true);
                  }}
                >
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
