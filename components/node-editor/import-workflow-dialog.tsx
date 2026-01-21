import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPaste } from "lucide-react";
import { Node, Edge } from "reactflow";
import { NodeData } from "./node-editor";

interface ImportWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (nodes: Node<NodeData>[], edges: Edge[]) => void;
}

export function ImportWorkflowDialog({ open, onOpenChange, onImport }: ImportWorkflowDialogProps) {
    const [json, setJson] = useState("");
    const { toast } = useToast();

    const handleImport = () => {
        try {
            const data = JSON.parse(json);
            if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
                throw new Error("Invalid workflow JSON format");
            }
            onImport(data.nodes, data.edges);
            setJson("");
            onOpenChange(false);
            toast({
                title: "Success",
                description: "Workflow imported successfully",
            });
        } catch {
            toast({
                title: "Error",
                description: "Failed to parse JSON. Please check the format.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Workflow JSON</DialogTitle>
                    <DialogDescription>
                        Paste the workflow JSON below to import it. This will replace the current workflow.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={json}
                        onChange={(e) => setJson(e.target.value)}
                        placeholder='{ "nodes": [...], "edges": [...] }'
                        className="font-mono text-sm h-[300px]"
                    />
                </div>
                <div className="absolute top-18 right-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                setJson(text);
                                toast({ title: "Pasted", description: "Content pasted from clipboard" });
                            } catch {
                                toast({ title: "Error", description: "Failed to read clipboard", variant: "destructive" });
                            }
                        }}
                    >
                        <ClipboardPaste className="h-4 w-4 mr-2" /> Paste
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!json.trim()}>
                        Import Workflow
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
