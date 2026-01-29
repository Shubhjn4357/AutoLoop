"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Node, Edge } from "reactflow";
import { NodeEditor, NodeData } from "@/components/node-editor/node-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutomationWorkflow } from "@/types";
import { ArrowLeft, Loader2, Settings } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { WorkflowSettingsDialog } from "@/components/node-editor/workflow-settings-dialog";

export default function WorkflowBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { get, post, patch, loading } = useApi();

    const [workflow, setWorkflow] = useState<Partial<AutomationWorkflow>>({
        name: "New Workflow",
        nodes: [],
        edges: [],
    });
    const [isReady, setIsReady] = useState(false);

    // Initialize
    useEffect(() => {
        const init = async () => {
            if (params.id && params.id !== "new") {
                const result = await get<{ workflow: AutomationWorkflow }>(`/api/workflows/${params.id}`);
                if (result && result.workflow) {
                    setWorkflow(result.workflow);
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load workflow",
                        variant: "destructive",
                    });
                    router.push("/dashboard/workflows");
                }
            }
            setIsReady(true);
        };
        init();
    }, [params.id, get, router, toast]);

    const [isManualSaving, setIsManualSaving] = useState(false);

    const handleSave = async (nodes: Node<NodeData>[], edges: Edge[], options?: { isAutoSave?: boolean }) => {
        const isNew = params.id === "new";
        const isAutoSave = options?.isAutoSave;

        if (!isAutoSave) setIsManualSaving(true);

        const workflowData = {
            ...workflow,
            nodes,
            edges,
        };

        const apiOptions = isAutoSave ? { skipNotification: true } : undefined;

        let result;
        if (isNew) {
            result = await post<{ workflow: AutomationWorkflow }>("/api/workflows", workflowData, apiOptions);
        } else {
            result = await patch<{ workflow: AutomationWorkflow }>(`/api/workflows/${params.id}`, workflowData, apiOptions);
        }

        if (result && result.workflow) {
            if (!isAutoSave) {
                toast({
                    title: "Success",
                    description: "Workflow saved successfully",
                });
            }

            if (isNew && result.workflow.id) {
                // Update URL without reloading so we stay in edit mode
                router.replace(`/dashboard/workflows/builder/${result.workflow.id}`);
            }
        } else if (!isAutoSave) {
            toast({
                title: "Error",
                description: "Failed to save workflow",
                variant: "destructive",
            });
        }

        if (!isAutoSave) setIsManualSaving(false);
    };

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleSettingsSave = (updates: Partial<AutomationWorkflow>) => {
        setWorkflow(prev => ({ ...prev, ...updates }));
    };

    if (!isReady) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-background overflow-y-auto">
            {/* Header for Back button and Name (Immersive Mode) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b shrink-0 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/workflows")} className="px-2 sm:px-4">
                        <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Input
                                value={workflow.name || ""}
                                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                                className="h-8 font-semibold text-lg border-transparent hover:border-input focus:border-input px-2 transition-colors -ml-2 w-full sm:w-[300px]"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSettingsOpen(true)}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground px-2 hidden sm:block truncate max-w-[300px]">
                            {workflow.description || (params.id === 'new' ? 'Create new workflow' : 'Edit workflow')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        size="sm"
                        onClick={() => handleSave((workflow.nodes as Node<NodeData>[]) || [], (workflow.edges as Edge[]) || [])}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {isManualSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Workflow
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden h-screen">
                <NodeEditor
                    initialNodes={(workflow.nodes as Node<NodeData>[]) || []}
                    initialEdges={(workflow.edges as Edge[]) || []}
                    onSave={handleSave}
                    isSaving={loading}
                    workflowId={params.id !== 'new' ? (params.id as string) : undefined}
                />
            </div>

            <WorkflowSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                workflow={workflow}
                onSave={handleSettingsSave}
            />
        </div>
    );
}
