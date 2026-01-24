"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Node, Edge } from "reactflow";
import { NodeEditor, NodeData } from "@/components/node-editor/node-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutomationWorkflow } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

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

    const handleSave = async (nodes: Node<NodeData>[], edges: Edge[]) => {
        const isNew = params.id === "new";
        const workflowData = {
            ...workflow,
            nodes,
            edges,
        };

        let result;
        if (isNew) {
            result = await post<{ id: string }>("/api/workflows", workflowData);
            if (result && result.id) {
                // Redirect to edit mode so we don't create duplicates on subsequent saves
                // router.replace(`/dashboard/workflows/builder/${result.id}`);
                // Actually, let's keep it simple for now, maybe just toast
            }
        } else {
            result = await patch(`/api/workflows/${params.id}`, workflowData);
        }

        if (result) {
            toast({
                title: "Success",
                description: "Workflow saved successfully",
            });
            if (isNew) {
                router.push("/dashboard/workflows");
            }
        } else {
            toast({
                title: "Error",
                description: "Failed to save workflow",
                variant: "destructive",
            });
        }
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
                        <Input
                            value={workflow.name || ""}
                            onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 font-semibold text-lg border-transparent hover:border-input focus:border-input px-2 transition-colors -ml-2 w-full sm:w-[300px]"
                        />
                        <p className="text-xs text-muted-foreground px-2 hidden sm:block">
                            {params.id === 'new' ? 'Create new workflow' : 'Edit workflow'}
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
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        </div>
    );
}
