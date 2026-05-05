"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, MessageCircle, UserPlus, BookOpen, Globe,
  ChevronRight, Check, Clock, BellRing, GripVertical,
  Trash2, Plus, Loader2, ArrowLeft,
  ToggleLeft, ToggleRight, Filter, Bot
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";
import { conditionOperators } from "@/lib/automation/rules";
import type { IGMedia } from "@/lib/instagram/graph";
import type { automations as AutoType } from "@/lib/db/schema";

type Automation = typeof AutoType.$inferSelect;

const TRIGGER_TYPES = [
  { id: "dm", label: "DM Reply", icon: MessageSquare, desc: "Reply to incoming direct messages", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "comment", label: "Comment Reply", icon: MessageCircle, desc: "Reply when someone comments on the post", color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20" },
  { id: "follow", label: "New Follow", icon: UserPlus, desc: "Trigger when someone follows you", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "story_reply", label: "Story Reply", icon: BookOpen, desc: "Reply when someone responds to your story", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
];

interface FlowStep {
  id: string;
  type: "condition" | "reply" | "delay" | "follow_up";
  label: string;
}

function DraggableStep({ step, onRemove }: { step: FlowStep; onRemove: () => void }) {
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
        "flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2.5 text-sm backdrop-blur cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-40"
      )}
    >
      <GripVertical className="size-4 text-muted-foreground shrink-0" />
      <span className="flex-1 font-medium">{step.label}</span>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="size-3.5" />
      </button>
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
  { id: "cond", type: "condition", label: "Keyword condition" },
  { id: "reply", type: "reply", label: "Send reply" },
  { id: "delay", type: "delay", label: "Wait / delay" },
  { id: "followup", type: "follow_up", label: "Follow-up message" },
];

interface Props {
  igUserId: string;
  accessToken: string;
  existingAutomations: Automation[];
  createAutomationAction: (formData: FormData) => Promise<void> | void;
  toggleAutomationAction: (formData: FormData) => Promise<void> | void;
  deleteAutomationAction: (formData: FormData) => Promise<void> | void;
}

type Step = "select-target" | "select-trigger" | "configure";

export function AutomationsWorkspace({
  existingAutomations,
  createAutomationAction,
  toggleAutomationAction,
  deleteAutomationAction,
}: Props) {
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<"ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS">("ALL");
  
  const [activeTab, setActiveTab] = useState<"builder" | "manage">("builder");
  const [step, setStep] = useState<Step>("select-target");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Auto-fetch real Instagram media on mount
  useEffect(() => {
    fetch("/api/instagram/media")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setMedia(d.data); })
      .catch(() => {})
      .finally(() => setLoadingMedia(false));
  }, []);

  const selectedPost = media.find((m) => m.id === selectedPostId) ?? null;
  const filteredMedia = mediaFilter === "ALL" ? media : media.filter((m) => m.media_type === mediaFilter);
  
  // Automations for this specific target
  const targetAutomations = existingAutomations.filter((a) => {
    try {
      const flow = JSON.parse(a.flowJson ?? "{}");
      if (selectedPostId === null) return !flow.targetPostId;
      return flow.targetPostId === selectedPostId;
    } catch { return false; }
  });

  function handleSelectPost(id: string | null) {
    setSelectedPostId(id);
    setStep("select-trigger");
    setSelectedTrigger("");
    setFlowSteps([]);
    setEditingId(null);
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
    data.set("flowJson", JSON.stringify(flowSteps));
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
            <div className="flex gap-1 bg-muted/30 rounded-xl p-1 text-xs font-medium">
              {(["ALL", "IMAGE", "VIDEO", "REELS"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setMediaFilter(f as typeof mediaFilter)}
                  className={cn("flex-1 py-1.5 rounded-lg transition-all", mediaFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {f === "ALL" ? "All" : f === "IMAGE" ? "Posts" : f === "VIDEO" ? "Video" : "Reels"}
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
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => {
                            setStep("configure");
                            setSelectedTrigger(auto.triggerType);
                            setEditingId(auto.id);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <Bot className="size-4" />
                        </button>
                        <form action={toggleAutomationAction}>
                          <input type="hidden" name="id" value={auto.id} />
                          <input type="hidden" name="isActive" value={auto.isActive ? "false" : "true"} />
                          <button type="submit" className={cn("text-xs transition-colors", auto.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                            {auto.isActive ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                          </button>
                        </form>
                        <form action={deleteAutomationAction}>
                          <input type="hidden" name="id" value={auto.id} />
                          <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        </form>
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
                className="flex flex-col items-center justify-center p-16 text-center gap-4"
              >
                <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Filter className="size-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Select a Target</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choose a specific post or story from the left panel, or select Account-wide to trigger on all DMs.
                </p>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Condition operator */}
                    <div className="space-y-2">
                      <Label htmlFor="conditionOperator">Match Type</Label>
                      <select
                        id="conditionOperator"
                        name="conditionOperator"
                        className="w-full h-10 rounded-xl border border-input bg-background/60 px-3 text-sm backdrop-blur"
                        defaultValue={existingAutomations.find(a => a.id === editingId)?.conditionOperator ?? "contains"}
                      >
                        {conditionOperators.map((op) => (
                          <option key={op} value={op}>{op.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>

                    {/* Keyword */}
                    <div className="space-y-2">
                      <Label htmlFor="condition">Keyword / Trigger Word</Label>
                      <Input 
                        id="condition" 
                        name="condition" 
                        placeholder="e.g. price, info, link" 
                        defaultValue={existingAutomations.find(a => a.id === editingId)?.condition ?? ""}
                      />
                    </div>
                  </div>

                  {/* Response */}
                  <div className="space-y-2">
                    <Label htmlFor="responseTemplate">Auto Response</Label>
                    <Textarea
                      id="responseTemplate"
                      name="responseTemplate"
                      required
                      rows={3}
                      placeholder="Thanks for your message! Here's what you need to know..."
                      className="resize-none"
                      defaultValue={existingAutomations.find(a => a.id === editingId)?.responseTemplate ?? ""}
                    />
                  </div>

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
                          <DraggableStep step={s} onRemove={() => setFlowSteps((prev) => prev.filter((x) => x.id !== s.id))} />
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
                    <form action={toggleAutomationAction}>
                      <input type="hidden" name="id" value={auto.id} />
                      <input type="hidden" name="isActive" value={auto.isActive ? "false" : "true"} />
                      <button type="submit" className={cn("transition-all hover:scale-110", auto.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                        {auto.isActive ? <ToggleRight className="size-8" /> : <ToggleLeft className="size-8" />}
                      </button>
                    </form>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base">{auto.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Trigger: <span className="text-foreground font-medium">{auto.triggerType}</span> · 
                      Match: <span className="text-foreground font-medium">{auto.condition || "Any"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <button 
                      onClick={() => {
                        setEditingId(auto.id);
                        setSelectedTrigger(auto.triggerType);
                        setActiveTab("builder");
                        setStep("configure");
                      }}
                      className="flex-1 h-9 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/80 transition-colors"
                    >
                      Edit Rule
                    </button>
                    <form action={deleteAutomationAction} className="shrink-0">
                      <input type="hidden" name="id" value={auto.id} />
                      <button type="submit" className="size-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
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
      </div>
    </DndProvider>
  );
}
