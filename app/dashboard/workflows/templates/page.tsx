"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Plus, MapPin, Search, Mail, UserPlus, Star, Database, FileText } from "lucide-react";
import type { ComponentType, SVGProps, ReactElement } from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Define icons map
const Icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    MapPin,
    Search,
    Mail,
    UserPlus,
    Star,
    Database,
    FileText
};

interface PresetTemplate {
    name: string;
    description: string;
    targetBusinessType?: string;
    keywords?: string[];
    icon?: string;
    emailTemplates?: Array<{
        name: string;
        subject: string;
        body: string;
    }>;
}

interface TemplateApiResponse {
    templates: PresetTemplate[];
}

interface TemplateInstallResponse {
    success: boolean;
    workflowId: string;
}

export default function TemplatesPage() {
    const { get, post } = useApi();
    const { toast } = useToast();
    const router = useRouter();
    const [templates, setTemplates] = useState<PresetTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<number | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<PresetTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const loadTemplates = async () => {
            setLoading(true);
            const result = await get("/api/workflows/templates") as TemplateApiResponse | null;
            if (result?.templates) {
                setTemplates(result.templates);
            }
            setLoading(false);
        };
        loadTemplates();
    }, [get]);

    const installTemplate = async (index: number) => {
        setInstalling(index);
        try {
            const result = await post("/api/workflows/templates", { templateIndex: index }) as TemplateInstallResponse | null;

            if (result?.success) {
                toast({
                    title: "Template Installed",
                    description: `${templates[index].name} has been added to your workflows`,
                });
                router.push(`/dashboard/workflows/builder/${result.workflowId}`);
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to install template",
                variant: "destructive",
            });
        } finally {
            setInstalling(null);
        }
    };

    const getIcon = (iconName?: string): ReactElement => {
        const IconComponent = iconName && Icons[iconName] ? Icons[iconName] : FileText;
        return <IconComponent className="h-6 w-6 text-blue-500 mb-2" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Workflow Templates</h1>
                    <p className="text-muted-foreground">Get started with pre-built automation workflows</p>
                </div>
                <Button onClick={() => router.push("/dashboard/workflows/builder/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom
                </Button>
            </div>

            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                            One-click template installation
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Install any template to get started immediately. Customize it later in the workflow builder.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    templates.map((template, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                            <CardHeader>
                                {getIcon(template.icon)}
                                <CardTitle className="line-clamp-1 text-lg">{template.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10">{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    {template.keywords && template.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {template.keywords.slice(0, 3).map((keyword, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {template.emailTemplates && template.emailTemplates.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">{template.emailTemplates.length}</span> email templates included
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowPreview(true);
                                        }}
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Preview
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => installTemplate(index)}
                                        disabled={installing === index}
                                    >
                                        {installing === index ? "Installing..." : "Install"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            {getIcon(selectedTemplate?.icon)}
                            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                        </div>
                        <DialogDescription>{selectedTemplate?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {selectedTemplate?.emailTemplates && selectedTemplate.emailTemplates.length > 0 ? (
                            selectedTemplate.emailTemplates.map((template, i) => (
                                <div key={i} className="space-y-2 border rounded-lg p-4 bg-muted/30">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {template.name}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Subject</p>
                                            <p className="bg-background border p-2 rounded text-sm">{template.subject}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Body</p>
                                            <p className="bg-background border p-2 rounded whitespace-pre-wrap text-sm">{template.body}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>This workflow defines structure but does not include pre-written email templates.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 justify-end border-t mt-4">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                const index = templates.indexOf(selectedTemplate!);
                                installTemplate(index);
                                setShowPreview(false);
                            }}
                            disabled={installing !== null}
                        >
                            {installing !== null ? "Installing..." : "Install This Template"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
