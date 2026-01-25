"use client";

import { useState, useEffect } from "react";
import { EmailEditor } from "@/components/email/email-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailTemplate, UserProfile } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Star, Loader2, MoreVertical, Edit, Check, ArrowLeft } from "lucide-react";

import { useTemplates } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";

export default function TemplatesPage() {
  const { templates, saveTemplate, deleteTemplate, loading } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<EmailTemplate>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  const { get: getUser } = useApi<{ user: UserProfile }>();
  const { post: generateAiTemplate } = useApi<{ subject: string; body: string }>();

  // ... (existing useEffect) ...

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getUser("/api/settings");
      if (data?.user) {
        setUserProfile(data.user);
      }
    };
    fetchProfile();
  }, [getUser]);

  const handleSave = async () => {
    const success = await saveTemplate(selectedTemplate);
    if (success) {
      setIsCreating(false);
      setSelectedTemplate({});
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;

    const success = await deleteTemplate(id);
    if (success) {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (template: EmailTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await saveTemplate({ id: template.id, isDefault: true });
    if (success) {
      toast({
        title: "Success",
        description: "Default template updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to set default template",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWithAI = async (prompt: string) => {
    // ... (existing logic) ...
    setIsGenerating(true);
    const generated = await generateAiTemplate("/api/templates/generate", {
      businessType: "businesses",
      purpose: prompt
    });

    if (generated) {
      setSelectedTemplate({
        ...selectedTemplate,
        subject: generated.subject,
        body: generated.body,
      });

      toast({
        title: "Generated!",
        description: "Your email template has been created with AI.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to generate template",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <EmailEditor
            template={selectedTemplate}
            onChange={setSelectedTemplate}
            onGenerateWithAI={handleGenerateWithAI}
            isGenerating={isGenerating}
            userProfile={userProfile}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setSelectedTemplate({});
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-2">
                    <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                    {template.isDefault && (
                      <div className="mt-2">
                        <Badge variant="default" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-500/50 dark:text-yellow-400">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          Default
                        </Badge>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setSelectedTemplate(template);
                        setIsCreating(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSetDefault(template, e)} disabled={template.isDefault}>
                        <Check className="mr-2 h-4 w-4" /> Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(template.id, e)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="text-sm text-muted-foreground line-clamp-3 mb-2 prose prose-sm dark:prose-invert max-h-18 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: template.body || template.subject || "No content" }}
                />
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button onClick={() => setIsCreating(true)}>
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
