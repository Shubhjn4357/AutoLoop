"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, MessageCircle, UserPlus, BookOpen,
  ChevronRight, GripVertical,
  Trash2, Plus, Loader2,
  Bot, Check, Filter, ArrowLeft,
  BellRing, Clock, Globe, Link2
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AutomationToggle } from "./automation-toggle";
import { deleteAutomation } from "@/lib/actions/automations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { conditionOperators } from "@/lib/automation/rules";
import type { IGMedia } from "@/lib/instagram/graph";
import type { automations as AutoType } from "@/lib/db/schema";
import { AutomationsSkeleton } from "@/components/dashboard/skeletons";

type Automation = typeof AutoType.$inferSelect;

const TRIGGER_TYPES = [
  { id: "dm", label: "DM Reply", icon: MessageSquare, desc: "Reply to incoming direct messages", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "comment", label: "Comment Reply", icon: MessageCircle, desc: "Reply when someone comments on the post", color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20" },
  { id: "follow", label: "New Follow", icon: UserPlus, desc: "Trigger when someone follows you", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "story_reply", label: "Story Reply", icon: BookOpen, desc: "Reply when someone responds to your story", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
];

interface FlowStep {
  id: string;
  type: "condition" | "reply" | "delay" | "follow_up" | "button";
  label: string;
  config?: Record<string, unknown>;
}

function DraggableStep({ step, onRemove, onUpdate, isPalette }: { step: FlowStep; onRemove?: () => void; onUpdate?: (newStep: FlowStep) => void; isPalette?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "step",
    item: step,
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));
  drag(ref);
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-background/60 p-3 text-sm backdrop-blur transition-all",
        isDragging && "opacity-40",
        isPalette ? "cursor-grab active:cursor-grabbing" : ""
      )}
    >
      <div className={cn("flex items-center gap-3", !isPalette && "cursor-grab active:cursor-grabbing")}>
        <GripVertical className="size-4 text-muted-foreground shrink-0" />
        <span className="flex-1 font-medium">{step.label}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      {!isPalette && step.type === "reply" && onUpdate && (
        <div className="pl-7 pr-2 pt-1">
          <Textarea
            value={(step.config?.text as string) || ""}
            onChange={(e) => onUpdate({ ...step, config: { ...step.config, text: e.target.value } })}
            placeholder="Enter message text..."
            className="h-16 resize-none text-xs bg-background/50"
          />
        </div>
      )}
      {!isPalette && step.type === "delay" && onUpdate && (
        <div className="pl-7 pr-2 pt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Wait for</span>
          <Input
            type="number"
            min="0"
            value={(step.config?.delayMinutes as number) ?? 60}
            onChange={(e) => onUpdate({ ...step, config: { ...step.config, delayMinutes: parseInt(e.target.value) || 0 } })}
            className="w-20 h-8 text-xs bg-background/50"
          />
          <span className="text-xs text-muted-foreground">minutes</span>
        </div>
      )}
    </div>
  );
}

function DropZone({ onDrop }: { onDrop: (step: FlowStep) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "step",
    drop: (item: FlowStep) => onDrop(item),
    collect: (m) => ({ isOver: m.isOver() }),
  }));
  drop(ref);
  return (
    <div
      ref={ref}
      className={cn(
        "border-2 border-dashed rounded-xl p-4 text-center text-sm text-muted-foreground transition-all",
        isOver ? "border-primary bg-primary/5 text-primary" : "border-white/10"
      )}
    >
      {isOver ? "Release to add step" : "Drag steps here to build your flow"}
    </div>
  );
}

const PALETTE_STEPS: FlowStep[] = [
  { id: "cond", type: "condition", label: "Keyword condition", config: {} },
  { id: "reply", type: "reply", label: "Send reply", config: { text: "" } },
  { id: "delay", type: "delay", label: "Wait / delay", config: { delayMinutes: 60 } },
  { id: "followup", type: "follow_up", label: "Follow-up message", config: { text: "" } },
];

interface Props {
  igUserId: string;
  accessToken: string;
  existingAutomations: Automation[];
  createAutomationAction: (formData: FormData) => Promise<void> | void;
}

type Step = "select-target" | "select-trigger" | "configure";

export function AutomationsWorkspace({
  existingAutomations,
  createAutomationAction,
}: Props) {
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [stories, setStories] = useState<IGMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<"ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS" | "STORY">("ALL");
  
  const [activeTab, setActiveTab] = useState<"builder" | "manage">("builder");
  const [step, setStep] = useState<Step>("select-target");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("contains");
  
  const [isPending, startTransition] = useTransition();

  // Auto-fetch real Instagram media on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/instagram/media").then((r) => r.json()),
      fetch("/api/instagram/stories").then((r) => r.json()),
    ])
      .then(([mRes, sRes]) => {
        if (Array.isArray(mRes.data)) setMedia(mRes.data);
        if (Array.isArray(sRes.data)) setStories(sRes.data);
      })
      .catch(() => {})
      .finally(() => setLoadingMedia(false));
  }, []);

  if (loadingMedia) return <AutomationsSkeleton />;

  const allItems = [...media, ...stories];
  const selectedPost = allItems.find((m) => m.id === selectedPostId) ?? null;
  const filteredMedia = mediaFilter === "ALL" 
    ? allItems 
    : mediaFilter === "STORY" 
      ? stories 
      : media.filter((m) => m.media_type === mediaFilter);
  
  // Automations for this specific target
  const targetAutomations = existingAutomations.filter((a) => {
    try {
      const flow = JSON.parse(a.flowJson ?? "{}");
      const targetPostId = flow.targetPostId;
      if (selectedPostId === null) return !targetPostId;
      return targetPostId === selectedPostId;
    } catch { return false; }
  });

  function handleSelectPost(id: string | null) {
    setSelectedPostId(id);
    // If there are automations for this post, we might want to stay in select-target 
    // to see them, but the user said "select from it or create it".
    // Let's stay in select-target but the Right panel will show the list if we have any.
    // Otherwise, it prompts to create.
    setStep("select-target"); 
    setSelectedTrigger("");
    setFlowSteps([]);
    setEditingId(null);
    setSelectedOperator("contains");
  }

  function handleBack() {
    if (step === "configure") { setStep("select-trigger"); return; }
    if (step === "select-trigger") { setStep("select-target"); return; }
  }

  function handleDropStep(newStep: FlowStep) {
    setFlowSteps((prev) => {
      if (prev.find((s) => s.id === newStep.id)) return prev;
      return [...prev, { ...newStep, id: `${newStep.id}-${Date.now()}` }];
    });
  }

  function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("targetPostId", selectedPostId ?? "");
    data.set("triggerType", selectedTrigger);
    const flowJson = JSON.stringify({
      targetPostId: selectedPostId || null,
      steps: flowSteps
    });
    data.set("flowJson", flowJson);
    
    // Ensure required fields for non-visible triggers have defaults
    if (!data.get("responseTemplate")) data.set("responseTemplate", "Reply sent!");
    
    if (editingId) data.set("id", editingId);
    startTransition(() => createAutomationAction(data));
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Workspace Tabs */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button 
            onClick={() => setActiveTab("builder")}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-all border-b-2",
              activeTab === "builder" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Flow Builder
          </button>
          <button 
            onClick={() => setActiveTab("manage")}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-all border-b-2",
              activeTab === "manage" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Manage Rules ({existingAutomations.length})
          </button>
        </div>

        {activeTab === "builder" ? (
          <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* LEFT — Post/Story Selector */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Select Target</h2>
            
            {/* Filter tabs */}
            <div className="flex gap-1 bg-muted/30 rounded-xl p-1 text-xs font-medium overflow-x-auto">
              {(["ALL", "IMAGE", "VIDEO", "REELS", "STORY"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setMediaFilter(f as typeof mediaFilter)}
                  className={cn("flex-1 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap", mediaFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {f === "ALL" ? "All" : f === "IMAGE" ? "Posts" : f === "VIDEO" ? "Video" : f === "REELS" ? "Reels" : "Stories"}
                </button>
              ))}
            </div>

            {/* Account-wide option */}
            <button
              type="button"
              onClick={() => handleSelectPost(null)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                selectedPostId === null && step !== "select-target" ? "border-primary bg-primary/10 text-primary font-medium" : "border-white/10 bg-background/40"
              )}
            >
              <div className="size-10 rounded-lg bg-linear-to-br from-primary/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                <Globe className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Account-wide</p>
                <p className="text-xs text-muted-foreground">Applies to all posts & DMs</p>
              </div>
              {selectedPostId === null && step !== "select-target" && (
                <Check className="size-4 ml-auto text-primary" />
              )}
            </button>

            {/* Posts/Stories grid */}
            {loadingMedia ? (
              <div className="grid grid-cols-3 gap-2 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : filteredMedia.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No {mediaFilter === "ALL" ? "" : mediaFilter.toLowerCase()} posts found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredMedia.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => handleSelectPost(post.id)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-primary/60 hover:scale-[1.02]",
                      selectedPostId === post.id ? "border-primary shadow-[0_0_12px] shadow-primary/30" : "border-white/10"
                    )}
                  >
                    {(post.media_url || post.thumbnail_url) && (
                      <Image
                        src={post.media_url ?? post.thumbnail_url!}
                        alt={post.caption?.substring(0, 20) ?? "post"}
                        fill unoptimized className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                      <span className="text-[9px] text-foreground font-bold bg-background/80 backdrop-blur-md rounded px-1.5 py-0.5 shadow-sm">
                        {post.media_type === "CAROUSEL_ALBUM" ? "ALBUM" : post.media_type}
                      </span>
                      {selectedPostId === post.id && (
                        <span className="size-4 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                          <Check className="size-2.5 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Existing automations */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
              {step === "select-target" ? "All Automation Rules" : "Rules for Target"} ({step === "select-target" ? existingAutomations.length : targetAutomations.length})
            </h2>
            {(step === "select-target" ? existingAutomations : targetAutomations).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No rules found</p>
            ) : (
              <div className="space-y-2">
                {(step === "select-target" ? existingAutomations : targetAutomations).map((auto) => (
                    <div key={auto.id} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{auto.name}</p>
                        <p className="text-[10px] text-muted-foreground">{auto.triggerType} · {auto.condition || "any"}</p>
                      </div>
                      <div className="flex items-center justify-center gap-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => {
                            setStep("configure");
                            setSelectedTrigger(auto.triggerType);
                            setEditingId(auto.id);
                            try {
                              const autoToEdit = existingAutomations.find(a => a.id === auto.id);
                              setSelectedOperator(autoToEdit?.conditionOperator ?? "contains");
                              const parsed = JSON.parse(auto.flowJson ?? "{}");
                              const steps = Array.isArray(parsed) ? parsed : (parsed.steps || []);
                              setFlowSteps(steps);
                            } catch { setFlowSteps([]); }
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <Bot className="size-4" />
                        </button>
                        <AutomationToggle id={auto.id} initialStatus={auto.isActive ?? false} />
                        <button 
                          type="button"
                          onClick={() => {
                            setDeleteId(auto.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* RIGHT — Step panel */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Step 1 — Prompt to select */}
            {step === "select-target" && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 space-y-6"
              >
                <div className="flex flex-col items-center justify-center text-center gap-4 mb-4">
                  <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    {selectedPostId ? (
                      <div className="relative size-full rounded-2xl overflow-hidden">
                        <Image src={selectedPost?.media_url ?? selectedPost?.thumbnail_url ?? ""} alt="" fill className="object-cover opacity-50" unoptimized />
                        <Bot className="absolute inset-0 m-auto size-8 text-primary drop-shadow-lg" />
                      </div>
                    ) : (
                      <Filter className="size-8 text-primary" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{selectedPostId ? "Automations for this Post" : "Select a Target"}</h2>
                  <p className="text-muted-foreground max-w-sm">
                    {selectedPostId 
                      ? "Manage existing rules or create a new automation for this content." 
                      : "Choose a specific post or story from the left panel, or select Account-wide to trigger on all DMs."}
                  </p>
                </div>

                {selectedPostId && (
                  <div className="space-y-4">
                    {targetAutomations.length > 0 && (
                      <div className="grid gap-3">
                        {targetAutomations.map((auto) => (
                          <div key={auto.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all cursor-pointer group"
                            onClick={() => {
                              setEditingId(auto.id);
                              setSelectedTrigger(auto.triggerType);
                              setSelectedOperator(auto.conditionOperator ?? "contains");
                              setStep("configure");
                              try {
                                const parsed = JSON.parse(auto.flowJson ?? "{}");
                                setFlowSteps(Array.isArray(parsed) ? parsed : (parsed.steps || []));
                              } catch { setFlowSteps([]); }
                            }}
                          >
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Bot className="size-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm">{auto.name}</p>
                              <p className="text-xs text-muted-foreground">{auto.triggerType} · Match: {auto.condition || "Any"}</p>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all gap-2"
                      onClick={() => setStep("select-trigger")}
                    >
                      <Plus className="size-5" />
                      Create New Automation
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2 — Select trigger type */}
            {step === "select-trigger" && (
              <motion.div
                key="trigger"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="p-6 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-5" />
                  </button>
                  <div>
                    <h2 className="font-bold text-lg">Choose Trigger Type</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedPostId ? `Post: ${selectedPost?.caption?.substring(0, 30) ?? selectedPostId.substring(0, 12)}…` : "Account-wide automation"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {TRIGGER_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setSelectedTrigger(t.id); setStep("configure"); }}
                        className={cn(
                          "flex items-start gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                          t.color
                        )}
                      >
                        <div className={cn("p-2.5 rounded-xl border", t.color)}>
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.label}</p>
                          <p className="text-xs opacity-70 mt-0.5">{t.desc}</p>
                        </div>
                        <ChevronRight className="size-4 ml-auto mt-0.5 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3 — Configure */}
            {step === "configure" && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <button type="button" onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-5" />
                  </button>
                  <div>
                    <h2 className="font-bold text-lg">Configure Rule</h2>
                    <p className="text-xs text-muted-foreground capitalize">
                      {TRIGGER_TYPES.find((t) => t.id === selectedTrigger)?.label} trigger
                    </p>
                  </div>
                </div>

                <form onSubmit={submitForm} className="space-y-5">
                  {/* Rule Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="e.g. Price inquiry reply" 
                      defaultValue={existingAutomations.find(a => a.id === editingId)?.name ?? ""}
                    />
                  </div>

                  {(selectedTrigger === "comment" || selectedTrigger === "dm" || selectedTrigger === "story_reply") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Condition operator */}
                      <div className="space-y-2">
                        <Label htmlFor="conditionOperator">Match Type</Label>
                        <select
                          id="conditionOperator"
                          name="conditionOperator"
                          className="w-full h-10 rounded-xl border border-input bg-background/60 px-3 text-sm backdrop-blur"
                          value={selectedOperator}
                          onChange={(e) => setSelectedOperator(e.target.value)}
                        >
                          {conditionOperators.map((op) => (
                            <option key={op} value={op}>{op.replace("_", " ")}</option>
                          ))}
                        </select>
                      </div>

                      {/* Keyword */}
                      {selectedOperator !== "any" && (
                        <div className="space-y-2">
                          <Label htmlFor="condition">Keyword / Trigger Word</Label>
                          <Input 
                            id="condition" 
                            name="condition" 
                            placeholder="e.g. price, info, link" 
                            defaultValue={existingAutomations.find(a => a.id === editingId)?.condition ?? ""}
                          />
                        </div>
                      )}
                      {selectedOperator === "any" && (
                        <div className="flex items-end h-10">
                          <p className="text-xs text-muted-foreground mb-2 italic">Triggers on ANY {selectedTrigger} from users.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Public Comment Response (Only for Comment trigger) */}
                  {selectedTrigger === "comment" && (
                    <div className="space-y-2">
                      <Label htmlFor="responseTemplate">Public Comment Reply</Label>
                      <Textarea
                        id="responseTemplate"
                        name="responseTemplate"
                        required
                        rows={2}
                        placeholder="e.g. Just sent you a DM with the details! Check it out."
                        className="resize-none"
                        defaultValue={existingAutomations.find(a => a.id === editingId)?.responseTemplate ?? ""}
                      />
                    </div>
                  )}

                  {/* DM Message + Link (For Comment and DM triggers) */}
                  {(selectedTrigger === "comment" || selectedTrigger === "dm" || selectedTrigger === "story_reply") && (
                    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <MessageSquare className="size-4" />
                        Private DM Response
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dmTemplate">DM Message</Label>
                        <Textarea
                          id="dmTemplate"
                          name="dmTemplate"
                          required
                          rows={3}
                          placeholder="Write the message that will be sent to their inbox..."
                          className="resize-none bg-background/50"
                          defaultValue={existingAutomations.find(a => a.id === editingId)?.dmTemplate ?? ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetUrl">Link to Send (Optional)</Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            id="targetUrl" 
                            name="targetUrl" 
                            placeholder="https://yourlink.com/offer" 
                            className="pl-10 bg-background/50"
                            defaultValue={existingAutomations.find(a => a.id === editingId)?.targetUrl ?? ""}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">If provided, this link will be appended to your DM message.</p>
                      </div>
                    </div>
                  )}

                  {/* Follower check */}
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/40 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      name="requireFollower"
                      value="true"
                      className="size-4 rounded border-input accent-primary"
                      defaultChecked={existingAutomations.find(a => a.id === editingId)?.requireFollower ?? false}
                    />
                    <div>
                      <p className="text-sm font-medium">Require follower check</p>
                      <p className="text-xs text-muted-foreground">Only reply to users who follow you</p>
                    </div>
                  </label>

                  {/* Follow-up */}
                  <div className="space-y-3 rounded-xl border border-white/10 bg-background/30 p-4">
                    <div className="flex items-center gap-2">
                      <BellRing className="size-4 text-amber-500" />
                      <span className="text-sm font-semibold">Follow-up Message</span>
                    </div>
                    <Textarea
                      id="followUpTemplate"
                      name="followUpTemplate"
                      rows={2}
                      placeholder="Optional: just checking if you need anything else!"
                      className="resize-none"
                      defaultValue={existingAutomations.find(a => a.id === editingId)?.followUpTemplate ?? ""}
                    />
                    <div className="flex items-center gap-3">
                      <Clock className="size-4 text-muted-foreground shrink-0" />
                      <Label htmlFor="followUpDelayMinutes" className="text-xs shrink-0">Send after</Label>
                      <Input
                        id="followUpDelayMinutes"
                        name="followUpDelayMinutes"
                        type="number"
                        min="0"
                        defaultValue={existingAutomations.find(a => a.id === editingId)?.followUpDelayMinutes ?? 60}
                        className="w-24 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>

                  {/* Drag-and-drop flow builder */}
                  <div className="space-y-3 rounded-xl border border-white/10 bg-background/30 p-4">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      Flow Steps (drag to build)
                    </p>
                    {/* Palette */}
                    <div className="flex flex-wrap gap-2">
                      {PALETTE_STEPS.map((ps) => (
                        <button
                          key={ps.id}
                          type="button"
                          onClick={() => handleDropStep(ps)}
                          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                        >
                          <Plus className="size-3" /> {ps.label}
                        </button>
                      ))}
                    </div>
                    {/* Flow */}
                    <div className="space-y-2">
                      {flowSteps.map((s, idx) => (
                        <React.Fragment key={s.id}>
                          <DraggableStep 
                            step={s} 
                            onRemove={() => setFlowSteps((prev) => prev.filter((x) => x.id !== s.id))} 
                            onUpdate={(newStep) => setFlowSteps(prev => prev.map(x => x.id === newStep.id ? newStep : x))}
                          />
                          {idx < flowSteps.length - 1 && (
                            <div className="flex justify-center">
                              <div className="w-0.5 h-4 bg-border" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                      <DropZone onDrop={handleDropStep} />
                    </div>
                  </div>

                  <AnimatedButton type="submit" className="w-full rounded-full h-12 text-base" disabled={isPending}>
                    {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                    {isPending ? "Saving…" : "Save Automation Rule"}
                  </AnimatedButton>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
          </div>
        </div>
        ) : (
          /* MANAGE TAB */
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Automation Fleet</h2>
                <p className="text-sm text-muted-foreground">Monitor and control your entire library of active rules.</p>
              </div>
              <AnimatedButton size="sm" onClick={() => setActiveTab("builder")}>
                <Plus className="size-4 mr-1" /> Create Rule
              </AnimatedButton>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {existingAutomations.map((auto) => (
                <div key={auto.id} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Bot className="size-5" />
                    </div>
                    <AutomationToggle id={auto.id} initialStatus={auto.isActive ?? false} />
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base">{auto.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Trigger: <span className="text-foreground font-medium">{auto.triggerType}</span> · 
                      Match: <span className="text-foreground font-medium">{auto.condition || "Any"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-lg font-bold"
                      onClick={() => {
                        setEditingId(auto.id);
                        setSelectedTrigger(auto.triggerType);
                        setActiveTab("builder");
                        setStep("configure");
                      }}
                    >
                      Edit Rule
                    </Button>
                    <Button 
                      variant="destructive"
                      size="icon-sm"
                      className="shrink-0 rounded-lg"
                      onClick={() => {
                        setDeleteId(auto.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {existingAutomations.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Bot className="size-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <p className="text-muted-foreground">No automations created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Automation"
          description="Are you sure you want to delete this automation rule? This action cannot be undone."
          actionText="Delete"
          variant="destructive"
          onAction={async () => {
            if (deleteId) {
              try {
                await deleteAutomation(deleteId);
                toast.success("Automation deleted");
              } catch {
                toast.error("Failed to delete");
              } finally {
                setDeleteId(null);
              }
            }
          }}
        />
      </div>
    </DndProvider>
  );
}
