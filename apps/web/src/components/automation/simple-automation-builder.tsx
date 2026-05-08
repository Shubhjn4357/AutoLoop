"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  MessageCircle,
  UserPlus,
  BookOpen,
  AtSign,
  ChevronRight,
  Plus,
  Loader2,
  Bot,
  Check,
  ArrowLeft,
  BellRing,
  Clock,
  Link2,
  Sparkles,
  Target,
  Shield,
  Zap,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Trigger types with icons and descriptions
const TRIGGER_TYPES = [
  {
    id: "dm",
    label: "Direct Message",
    icon: MessageSquare,
    desc: "When someone sends you a DM",
    color: "blue",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-500",
  },
  {
    id: "comment",
    label: "Comment Reply",
    icon: MessageCircle,
    desc: "When someone comments on your post",
    color: "fuchsia",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
    textColor: "text-fuchsia-500",
  },
  {
    id: "story_reply",
    label: "Story Reply",
    icon: BookOpen,
    desc: "When someone replies to your story",
    color: "amber",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-500",
  },
  {
    id: "mention",
    label: "Mention",
    icon: AtSign,
    desc: "When someone mentions you",
    color: "purple",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-500",
  },
  {
    id: "follow",
    label: "New Follower",
    icon: UserPlus,
    desc: "When someone follows you",
    color: "emerald",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-500",
  },
];

// Match types
const MATCH_TYPES = [
  { value: "any", label: "Any message", desc: "Triggers on every message" },
  { value: "contains", label: "Contains keyword", desc: "Message includes specific word" },
  { value: "equals", label: "Exact match", desc: "Message matches exactly" },
  { value: "starts_with", label: "Starts with", desc: "Message begins with" },
  { value: "ends_with", label: "Ends with", desc: "Message ends with" },
  { value: "regex", label: "Regex pattern", desc: "Advanced pattern matching" },
];

// Step types for the wizard
type WizardStep = "trigger" | "condition" | "response" | "advanced" | "review";

interface AutomationRule {
  id?: string;
  name: string;
  triggerType: string;
  conditionOperator: string;
  condition?: string;
  targetPostId?: string | null;
  responseTemplate?: string;
  dmTemplate: string;
  targetUrl?: string;
  linkText?: string;
  followUpTemplate?: string;
  followUpDelayMinutes: number;
  followUpUrl?: string;
  followUpUrlText?: string;
  followUp2Template?: string;
  followUp2DelayMinutes: number;
  followUp2Url?: string;
  followUp2UrlText?: string;
  requireFollower: boolean;
  followerGateTemplate?: string;
  followerGateButtonText?: string;
  aiEnabled: boolean;
  aiPrompt?: string;
  cooldownMinutes: number;
  maxDailySends: number;
  isActive: boolean;
  priority: number;
}

interface SimpleAutomationBuilderProps {
  existingRules?: AutomationRule[];
  onSave: (rule: AutomationRule) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const defaultRule: AutomationRule = {
  name: "",
  triggerType: "dm",
  conditionOperator: "contains",
  dmTemplate: "",
  followUpDelayMinutes: 0,
  followUpUrl: "",
  followUpUrlText: "",
  followUp2DelayMinutes: 1440,
  followUp2Url: "",
  followUp2UrlText: "",
  requireFollower: false,
  followerGateTemplate: "Hey {{first_name}}! Please follow me first to unlock this automation. Once you follow, click the button below!",
  followerGateButtonText: "Follow Me",
  aiEnabled: false,
  cooldownMinutes: 5,
  maxDailySends: 100,
  isActive: true,
  priority: 0,
};

export function SimpleAutomationBuilder({
  existingRules = [],
  onSave,
  onDelete,
}: SimpleAutomationBuilderProps) {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [currentStep, setCurrentStep] = useState<WizardStep>("trigger");
  const [rule, setRule] = useState<AutomationRule>(defaultRule);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Wizard steps
  const steps: { id: WizardStep; label: string; icon: React.ElementType }[] = [
    { id: "trigger", label: "Trigger", icon: Zap },
    { id: "condition", label: "Condition", icon: Target },
    { id: "response", label: "Response", icon: MessageSquare },
    { id: "advanced", label: "Settings", icon: Shield },
    { id: "review", label: "Review", icon: Check },
  ];

  function handleStartCreate() {
    setRule(defaultRule);
    setCurrentStep("trigger");
    setMode("create");
  }

  function handleEdit(existingRule: AutomationRule) {
    setRule(existingRule);
    setCurrentStep("trigger");
    setMode("edit");
  }

  function handleNext() {
    const stepOrder: WizardStep[] = ["trigger", "condition", "response", "advanced", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }

  function handleBack() {
    const stepOrder: WizardStep[] = ["trigger", "condition", "response", "advanced", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      setMode("list");
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await onSave(rule);
        toast.success(mode === "create" ? "Automation created!" : "Automation updated!");
        setMode("list");
      } catch {
        toast.error("Failed to save automation");
      }
    });
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case "trigger":
        return !!rule.triggerType;
      case "condition":
        return rule.conditionOperator === "any" || !!rule.condition;
      case "response":
        // DM is optional if it's a comment trigger and public reply is set, or if AI is enabled
        if (rule.triggerType === "comment" && !!rule.responseTemplate) return true;
        if (rule.aiEnabled) return true;
        return !!rule.dmTemplate;
      default:
        return true;
    }
  }

  // Render the list view
  if (mode === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Automations</h2>
            <p className="text-muted-foreground">
              {existingRules.length} automation{existingRules.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <AnimatedButton onClick={handleStartCreate} className="gap-2">
            <Plus className="size-4" />
            New Automation
          </AnimatedButton>
        </div>

        {/* Rules Grid */}
        {existingRules.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <Bot className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first automation to automatically respond to DMs, comments, and more.
            </p>
            <Button onClick={handleStartCreate} variant="outline" className="gap-2">
              <Plus className="size-4" />
              Create Automation
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {existingRules.map((r) => {
              const trigger = TRIGGER_TYPES.find((t) => t.id === r.triggerType);
              const TriggerIcon = trigger?.icon || Bot;
              return (
                <Card
                  key={r.id}
                  className={cn(
                    "group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg",
                    r.isActive ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted"
                  )}
                  onClick={() => handleEdit(r)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          trigger?.bgColor,
                          trigger?.borderColor,
                          "border"
                        )}
                      >
                        <TriggerIcon className={cn("size-5", trigger?.textColor)} />
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={async (checked) => {
                            try {
                              await onSave({ ...r, isActive: checked });
                              toast.success(checked ? "Automation active" : "Automation paused");
                            } catch {
                              toast.error("Failed to update status");
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setDeleteId(r.id || null)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{r.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Trigger:</span>{" "}
                      {trigger?.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Condition:</span>{" "}
                      {r.conditionOperator === "any"
                        ? "Any message"
                        : `${r.conditionOperator}: "${r.condition}"`}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      <span className="font-medium text-foreground">Response:</span>{" "}
                      {r.dmTemplate}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {r.aiEnabled && (
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="size-3" />
                          AI
                        </Badge>
                      )}
                      {r.requireFollower && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="size-3" />
                          Followers only
                        </Badge>
                      )}
                      {r.followUpTemplate && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="size-3" />
                          Follow-up
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
          title="Delete Automation"
          description="Are you sure? This action cannot be undone."
          actionText="Delete"
          cancelText="Cancel"
          onAction={() => {
            if (deleteId && onDelete) {
              startTransition(() => onDelete(deleteId));
            }
            setDeleteId(null);
          }}
          variant="destructive"
        />
      </div>
    );
  }

  // Render the create/edit wizard
  return (
    <div className="max-w-3xl mx-auto">
      {/* Wizard Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to list
        </button>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              steps.findIndex((s) => s.id === currentStep) > index;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    isActive && "bg-primary/10 text-primary",
                    isCompleted && "text-emerald-500",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-emerald-500 text-white",
                      !isActive && !isCompleted && "bg-muted"
                    )}
                  >
                    {isCompleted ? <Check className="size-3" /> : index + 1}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* STEP 1: Trigger Type */}
          {currentStep === "trigger" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5" />
                  What should trigger this automation?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {TRIGGER_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = rule.triggerType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setRule({ ...rule, triggerType: t.id })}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:-translate-y-0.5",
                          isSelected
                            ? cn(t.bgColor, t.borderColor, "border-2")
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            isSelected ? t.bgColor : "bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-5",
                              isSelected ? t.textColor : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div>
                          <p className={cn("font-semibold", isSelected && t.textColor)}>
                            {t.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                        </div>
                        {isSelected && (
                          <Check className={cn("size-5 ml-auto", t.textColor)} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Automation Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Price Inquiry Reply"
                    value={rule.name}
                    onChange={(e) => setRule({ ...rule, name: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Condition */}
          {currentStep === "condition" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5" />
                  When should it trigger?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  {MATCH_TYPES.map((type) => {
                    const isSelected = rule.conditionOperator === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() =>
                          setRule({ ...rule, conditionOperator: type.value })
                        }
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.desc}</p>
                        </div>
                        {isSelected && <Check className="size-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {rule.conditionOperator !== "any" && (
                  <div className="space-y-2">
                    <Label htmlFor="condition">Keyword / Pattern</Label>
                    <Input
                      id="condition"
                      placeholder={
                        rule.conditionOperator === "regex"
                          ? "e.g., ^(price|cost)\b"
                          : "e.g., price, info, link"
                      }
                      value={rule.condition || ""}
                      onChange={(e) =>
                        setRule({ ...rule, condition: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {rule.conditionOperator === "contains" &&
                        "Triggers if the message includes this word/phrase (case-insensitive)"}
                      {rule.conditionOperator === "equals" &&
                        "Triggers only if the message matches exactly"}
                      {rule.conditionOperator === "starts_with" &&
                        "Triggers if the message starts with this"}
                      {rule.conditionOperator === "ends_with" &&
                        "Triggers if the message ends with this"}
                      {rule.conditionOperator === "regex" &&
                        "Advanced: Use regular expressions for complex matching"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Response */}
          {currentStep === "response" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  What should we send?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Public comment reply (for comment trigger) */}
                {rule.triggerType === "comment" && (
                  <div className="space-y-2">
                    <Label htmlFor="responseTemplate">Public Comment Reply</Label>
                    <Textarea
                      id="responseTemplate"
                      placeholder="e.g., Thanks! Check your DMs for details"
                      value={rule.responseTemplate || ""}
                      onChange={(e) =>
                        setRule({ ...rule, responseTemplate: e.target.value })
                      }
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be posted publicly as a reply to their comment
                    </p>
                  </div>
                )}

                {/* Response Type Selector */}
                <div className="flex p-1 bg-muted rounded-lg w-fit mb-6">
                  <button
                    onClick={() => setRule({ ...rule, aiEnabled: false })}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                      !rule.aiEnabled ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Standard Message
                  </button>
                  <button
                    onClick={() => setRule({ ...rule, aiEnabled: true })}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                      rule.aiEnabled ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className="size-3" />
                    AI Smart Reply
                  </button>
                </div>

                {!rule.aiEnabled ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* DM Response */}
                    <div className="space-y-2">
                      <Label htmlFor="dmTemplate">Message Text</Label>
                      <Textarea
                        id="dmTemplate"
                        placeholder="Write your message here..."
                        value={rule.dmTemplate}
                        onChange={(e) => setRule({ ...rule, dmTemplate: e.target.value })}
                        rows={4}
                      />
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">Variables:</span>
                        {["{{first_name}}", "{{name}}", "{{username}}"].map(
                          (v) => (
                            <button
                              key={v}
                              onClick={() =>
                                setRule({
                                  ...rule,
                                  dmTemplate: rule.dmTemplate + v,
                                })
                              }
                              className="px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20 transition-colors"
                            >
                              {v}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Link & Button Settings */}
                    <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <Link2 className="size-4 text-primary" />
                        Button / Website Link (Optional)
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="targetUrl">Website URL</Label>
                          <Input
                            id="targetUrl"
                            type="url"
                            placeholder="https://yourlink.com"
                            value={rule.targetUrl || ""}
                            onChange={(e) => setRule({ ...rule, targetUrl: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkText">Button Text</Label>
                          <Input
                            id="linkText"
                            placeholder="Visit Website"
                            value={rule.linkText || ""}
                            onChange={(e) => setRule({ ...rule, linkText: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      <span className="font-medium text-primary">AI Agent Mode Active</span>
                    </div>
                    <div className="space-y-2">
                      <Label>AI Instructions</Label>
                      <Textarea
                        placeholder="e.g., You are a friendly sales assistant. Be helpful and professional."
                        value={rule.aiPrompt || ""}
                        onChange={(e) =>
                          setRule({ ...rule, aiPrompt: e.target.value })
                        }
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        The AI will generate a personalized response based on these instructions and the user&apos;s message.
                      </p>
                    </div>
                  </div>
                )}

                {/* Follow-ups */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <BellRing className="size-4 text-amber-500" />
                    <span className="font-medium">Follow-up Messages (Optional)</span>
                  </div>

                  <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                    <div className="space-y-2">
                      <Label>First Follow-up Message</Label>
                      <Textarea
                        placeholder="e.g., Just checking if you need anything else!"
                        value={rule.followUpTemplate || ""}
                        onChange={(e) =>
                          setRule({ ...rule, followUpTemplate: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Follow-up Link (Optional)</Label>
                        <Input
                          type="url"
                          placeholder="https://link.com"
                          value={rule.followUpUrl || ""}
                          onChange={(e) => setRule({ ...rule, followUpUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Follow-up Button Text</Label>
                        <Input
                          placeholder="Check it out"
                          value={rule.followUpUrlText || ""}
                          onChange={(e) => setRule({ ...rule, followUpUrlText: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Send after</span>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={rule.followUpDelayMinutes}
                        onChange={(e) =>
                          setRule({
                            ...rule,
                            followUpDelayMinutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground">minutes (0 = immediate)</span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                    <div className="space-y-2">
                      <Label>Second Follow-up (Optional)</Label>
                      <Textarea
                        placeholder="e.g., Last chance to grab this offer!"
                        value={rule.followUp2Template || ""}
                        onChange={(e) =>
                          setRule({ ...rule, followUp2Template: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Link (Optional)</Label>
                        <Input
                          type="url"
                          placeholder="https://link.com"
                          value={rule.followUp2Url || ""}
                          onChange={(e) => setRule({ ...rule, followUp2Url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Button Text</Label>
                        <Input
                          placeholder="Final chance"
                          value={rule.followUp2UrlText || ""}
                          onChange={(e) => setRule({ ...rule, followUp2UrlText: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Send after</span>
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={rule.followUp2DelayMinutes}
                        onChange={(e) =>
                          setRule({
                            ...rule,
                            followUp2DelayMinutes: parseInt(e.target.value) || 1440,
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Advanced Settings */}
          {currentStep === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Features */}
                <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      <span className="font-medium">AI Smart Reply</span>
                    </div>
                    <Switch
                      checked={rule.aiEnabled}
                      onCheckedChange={(checked) =>
                        setRule({ ...rule, aiEnabled: checked })
                      }
                    />
                  </div>
                  {rule.aiEnabled && (
                    <div className="space-y-2">
                      <Label>AI Instructions</Label>
                      <Textarea
                        placeholder="e.g., You are a friendly sales assistant. Be helpful and professional."
                        value={rule.aiPrompt || ""}
                        onChange={(e) =>
                          setRule({ ...rule, aiPrompt: e.target.value })
                        }
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        The AI will use this prompt to generate contextual replies
                      </p>
                    </div>
                  )}
                </div>

                {/* Follower Check */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <UserPlus className="size-5 text-emerald-500" />
                      <div>
                        <p className="font-medium">Followers Only</p>
                        <p className="text-xs text-muted-foreground">
                          Only respond to users who follow you
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.requireFollower}
                      onCheckedChange={(checked) =>
                        setRule({ ...rule, requireFollower: checked })
                      }
                    />
                  </div>

                  {rule.requireFollower && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 rounded-xl border bg-muted/30 space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label>Custom Follower-Gate Message</Label>
                        <Textarea
                          placeholder="e.g., Please follow me to unlock this!"
                          value={rule.followerGateTemplate || ""}
                          onChange={(e) => setRule({ ...rule, followerGateTemplate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Follow Button Text</Label>
                        <Input
                          placeholder="Follow Me"
                          value={rule.followerGateButtonText || ""}
                          onChange={(e) => setRule({ ...rule, followerGateButtonText: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Rate Limiting */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                    <Input
                      id="cooldown"
                      type="number"
                      min="1"
                      value={rule.cooldownMinutes}
                      onChange={(e) =>
                        setRule({
                          ...rule,
                          cooldownMinutes: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum time between replies to the same user
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDaily">Daily Limit</Label>
                    <Input
                      id="maxDaily"
                      type="number"
                      min="1"
                      value={rule.maxDailySends}
                      onChange={(e) =>
                        setRule({
                          ...rule,
                          maxDailySends: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum sends per day for this automation
                    </p>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={rule.priority}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority automations are checked first
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: Review */}
          {currentStep === "review" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="size-5" />
                  Review & Save
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Name
                    </span>
                    <p className="font-medium">{rule.name}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Trigger
                    </span>
                    <p className="font-medium">
                      {TRIGGER_TYPES.find((t) => t.id === rule.triggerType)?.label}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Condition
                    </span>
                    <p className="font-medium">
                      {rule.conditionOperator === "any"
                        ? "Any message"
                        : `${rule.conditionOperator}: "${rule.condition}"`}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Response
                    </span>
                    <p className="font-medium whitespace-pre-wrap">{rule.dmTemplate}</p>
                    {rule.targetUrl && (
                      <p className="text-sm text-muted-foreground mt-2">
                        + Link: {rule.targetUrl}
                      </p>
                    )}
                  </div>

                  {(rule.followUpTemplate || rule.aiEnabled || rule.requireFollower) && (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Features
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rule.aiEnabled && <Badge>AI Smart Reply</Badge>}
                        {rule.requireFollower && <Badge>Followers Only</Badge>}
                        {rule.followUpTemplate && <Badge>Follow-up Message</Badge>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) =>
                        setRule({ ...rule, isActive: checked })
                      }
                    />
                    <span className="font-medium">
                      {rule.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <AnimatedButton
                    onClick={handleSave}
                    disabled={isPending}
                    className="gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {mode === "create" ? "Create Automation" : "Update Automation"}
                  </AnimatedButton>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isPending}
        >
          {currentStep === "trigger" ? "Cancel" : "Back"}
        </Button>
        {currentStep !== "review" && (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isPending}
            className="gap-2"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
