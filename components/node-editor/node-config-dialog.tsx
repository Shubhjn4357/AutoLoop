import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Node } from "reactflow";
import { NodeData } from "./node-editor";
import { useApi } from "@/hooks/use-api";

interface NodeConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    node: Node<NodeData>;
    onSave: (config: NodeData["config"]) => void;
}

interface EmailTemplate {
    id: string;
    name: string;
}

export function NodeConfigDialog({ open, onOpenChange, node, onSave }: NodeConfigDialogProps) {
    const [config, setConfig] = useState<NodeData["config"]>(node.data.config || {});
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);

    const { get, loading: loadingTemplates } = useApi<{ templates: EmailTemplate[] }>();

    useEffect(() => {
        setConfig(node.data.config || {});
    }, [node]);

    const fetchTemplates = useCallback(async () => {
        const result = await get('/api/templates');
        if (result) {
            setTemplates(result.templates || []);
        } else {
            // Fallback to default templates if API fails or returns null
            setTemplates([
                { id: 'template-1', name: 'Welcome Email' },
                { id: 'template-2', name: 'Follow-up Email' },
                { id: 'template-3', name: 'Custom Pitch' },
             ]);
        }
    }, [get]);

    // Fetch templates when dialog opens and node is template type
    useEffect(() => {
        if (open && node.data.type === "template") {
            fetchTemplates();
        }
    }, [open, node.data.type, fetchTemplates]);

    const handleSave = () => {
        onSave(config);
    };

    const renderConfigForm = () => {
        switch (node.data.type) {
            case "start":
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This is the starting point of your workflow. No configuration needed.
                        </p>
                    </div>
                );

            case "condition":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition Expression</Label>
                            <Input
                                id="condition"
                                placeholder="!website"
                                value={config?.condition || ""}
                                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Examples: !website (no website), email (has email), category == &quot;restaurant&quot;</p>
                                <p className="mt-1 font-medium">Available variables: website, email, phone, rating, reviewCount</p>
                            </div>
                        </div>
                    </div>
                );

            case "template":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="templateId">Email Template</Label>
                            <Select
                                value={config?.templateId || ""}
                                onValueChange={(value) => setConfig({ ...config, templateId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                    {templates.length === 0 && !loadingTemplates && (
                                        <SelectItem value="no-templates" disabled>
                                            No templates found
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select which email template to send when this node is reached
                            </p>
                        </div>
                    </div>
                );

            case "delay":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="delayHours">Delay (hours)</Label>
                            <Input
                                id="delayHours"
                                type="number"
                                min="1"
                                max="720"
                                placeholder="24"
                                value={config?.delayHours || ""}
                                onChange={(e) => setConfig({ ...config, delayHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Number of hours to wait before continuing to the next node
                            </p>
                        </div>
                    </div>
                );

            case "custom":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customCode">Custom Function Code</Label>
                            <Textarea
                                id="customCode"
                                placeholder="// JavaScript code here&#10;return true;"
                                rows={6}
                                value={config?.customCode || ""}
                                onChange={(e) => setConfig({ ...config, customCode: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Write custom JavaScript code. Return true to continue, false to stop.</p>
                                <p className="mt-1">Variables available as global objects: <code className="bg-muted px-1 rounded">company</code></p>
                                <p>Properties: name, email, phone, website, address, rating</p>
                            </div>
                        </div>
                    </div>
                );

            case "gemini":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="aiPrompt">AI Prompt</Label>
                            <Textarea
                                id="aiPrompt"
                                placeholder="Generate a personalized email subject line for {name}"
                                rows={4}
                                value={config?.aiPrompt || ""}
                                onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Enter a prompt for Gemini AI.</p>
                                <p className="mt-1">Use variables: {"{name}, {category}, {notes}, {website}, {address}"}</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configure {node.data.label}</DialogTitle>
                    <DialogDescription>
                        Set up the configuration for this workflow node
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {renderConfigForm()}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
