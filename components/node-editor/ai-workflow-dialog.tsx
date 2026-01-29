
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateWorkflowAction } from "@/app/actions/workflow-actions";
import { Loader2, Sparkles } from "lucide-react";
import { Node, Edge } from "reactflow";
import { NodeData } from "./node-editor";

interface AiWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (nodes: Node<NodeData>[], edges: Edge[]) => void;
}

export function AiWorkflowDialog({
    open,
    onOpenChange,
    onGenerate,
}: AiWorkflowDialogProps) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateWorkflowAction(prompt);

            if (result.success && result.data) {
                onGenerate(result.data.nodes, result.data.edges);
                onOpenChange(false);
                setPrompt("");
            } else {
                throw new Error(result.error || "Failed to generate workflow");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Generate Workflow with AI
                    </DialogTitle>
                    <DialogDescription>
                        Describe the workflow you want to build, and AI will generate it for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="E.g., Start with a webhook, wait 2 days, then send a welcome email if the user hasn't visited."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="h-32"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
