
import { useMemo, useRef, useState } from "react";
import { EmailTemplate, Business, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



interface EmailEditorProps {
  template: Partial<EmailTemplate>;
  onChange: (template: Partial<EmailTemplate>) => void;
  onGenerateWithAI?: (prompt: string) => void;
  isGenerating?: boolean;
  userProfile?: UserProfile;
}

const defaultSampleBusiness: Business = {
  id: "sample",
  userId: "sample",
  name: "Acme Sample Corp",
  email: "contact@sample.com",
  phone: "+1-555-0123",
  website: "https://sample.com",
  address: "123 Innovation Dr",
  category: "Technology",
  rating: 5.0,
  totalReviews: 10,
  source: "sample",
  emailStatus: null,
  lastContactedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function EmailEditor({
  template,
  onChange,
  onGenerateWithAI,
  isGenerating = false,
  userProfile = {},
}: EmailEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { businesses } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("sample");
  const [prompt, setPrompt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get the business to use for preview
  const previewBusiness = useMemo(() => {
    if (selectedBusinessId === "sample") return defaultSampleBusiness;
    return businesses.find((b) => b.id === selectedBusinessId) || defaultSampleBusiness;
  }, [selectedBusinessId, businesses]);

  // Use useMemo for derived state
  const preview = useMemo(() => {
    if (!template.body) return "";

    let body = template.body
      // Business/Recipient Variables
      .replace(/\{brand_name\}/g, previewBusiness.name)
      .replace(/\{email\}/g, previewBusiness.email || "")
      .replace(/\{phone\}/g, previewBusiness.phone || "")
      .replace(/\{website\}/g, previewBusiness.website || "")
      .replace(/\{address\}/g, previewBusiness.address || "")
      .replace(/\{category\}/g, previewBusiness.category)
      // Sender/User Variables
      .replace(/\{sender_name\}/g, userProfile?.name || "")
      .replace(/\{sender_email\}/g, userProfile?.email || "")
      .replace(/\{sender_phone\}/g, userProfile?.phone || "")
      .replace(/\{sender_company\}/g, userProfile?.company || "")
      .replace(/\{sender_website\}/g, userProfile?.website || "")
      .replace(/\{sender_job_title\}/g, userProfile?.jobTitle || "");

    // Custom Sender Variables
    if (userProfile?.customVariables) {
      Object.entries(userProfile.customVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        body = body.replace(regex, value);
      });
    }

    return body;
  }, [template.body, previewBusiness, userProfile]);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = template.body || "";
    const varText = `{${variable}}`;

    const newBody =
      currentBody.substring(0, start) +
      varText +
      currentBody.substring(end);

    onChange({
      ...template,
      body: newBody,
    });

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varText.length, start + varText.length);
    }, 0);
  };

  const handleGenerate = () => {
    if (onGenerateWithAI && prompt.trim()) {
      onGenerateWithAI(prompt);
      setIsDialogOpen(false);
      setPrompt("");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Template</CardTitle>
            {onGenerateWithAI && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Email with AI</DialogTitle>
                    <DialogDescription>
                      Describe the type of email you want to generate. Be specific about the tone and purpose.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="E.g., Write a friendly follow-up email to a restaurant owner about a new menu service..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGenerating}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              placeholder="My Template"
              value={template.name || ""}
              onChange={(e) =>
                onChange({ ...template, name: e.target.value })
              }
            />
            <div className="flex items-center space-x-2 pt-2">
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isDefault"
                  checked={template.isDefault || false}
                  onCheckedChange={(checked) => onChange({ ...template, isDefault: checked as boolean })}
                />
                <Label htmlFor="isDefault">Set as Default Template</Label>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder="Subject line with {brand_name}"
              value={template.subject || ""}
              onChange={(e) =>
                onChange({ ...template, subject: e.target.value })
              }
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Body (HTML supported)</label>
            <textarea
              ref={textareaRef}
              className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Your email body with {brand_name}, {email}, {phone}, {website}, {address}, {category}"
              value={template.body || ""}
              onChange={(e) =>
                onChange({ ...template, body: e.target.value })
              }
            />
          </div>

          {/* Variables Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Variables (Recipient)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  "brand_name",
                  "email",
                  "phone",
                  "website",
                  "address",
                  "category",
                ].map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Variables (Sender)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  "sender_name",
                  "sender_email",
                  "sender_phone",
                  "sender_company",
                  "sender_website",
                  "sender_job_title",
                ].map((variable) => (
                  <Badge
                    key={variable}
                    variant="default"
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
                {userProfile?.customVariables && Object.keys(userProfile.customVariables).map((key) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => insertVariable(key)}
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Click to insert at cursor position
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Preview</CardTitle>
            <div className="w-[180px]">
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sample">Sample Business</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/30 p-4 min-h-[400px]">
            <div className="mb-4 space-y-2 border-b pb-4">
              <div className="grid grid-cols-[60px_1fr] gap-2 text-sm">
                <div className="text-muted-foreground">To:</div>
                <div className="font-medium">{previewBusiness.email || "No email"}</div>
                <div className="text-muted-foreground">Subject:</div>
                <div className="font-medium">
                  {template.subject?.replace(/\{brand_name\}/g, previewBusiness.name) ||
                    "No subject"}
                </div>
              </div>
            </div>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: preview || "No content" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
