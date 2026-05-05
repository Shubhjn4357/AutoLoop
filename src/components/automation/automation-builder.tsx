"use client";

import * as React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ArrowRight, BellRing, Bot, Clock3, GripVertical, Plus, Trash2, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { automations } from "@/lib/db/schema";
import { conditionOperators, FlowBlock, parseFlowJson } from "@/lib/automation/rules";
import { cn } from "@/lib/utils";

type Automation = typeof automations.$inferSelect;

const blockType = "automation-block";

const palette: FlowBlock[] = [
  { id: "trigger", type: "trigger", label: "Instagram DM" },
  { id: "condition", type: "condition", label: "Condition" },
  { id: "reply", type: "reply", label: "Auto reply" },
  { id: "follow-up", type: "follow_up", label: "Follow-up" },
];

const defaultFlow: FlowBlock[] = [
  { id: "trigger-default", type: "trigger", label: "Instagram DM" },
  { id: "condition-default", type: "condition", label: "Condition" },
  { id: "reply-default", type: "reply", label: "Auto reply" },
];

interface AutomationBuilderProps {
  automations: Automation[];
  createAutomationAction: (formData: FormData) => void | Promise<void>;
  toggleAutomationAction: (formData: FormData) => void | Promise<void>;
  deleteAutomationAction: (formData: FormData) => void | Promise<void>;
}

function DraggablePaletteBlock({ block }: { block: FlowBlock }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: blockType,
    item: block,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-left text-sm transition hover:bg-muted",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="size-4 text-muted-foreground" />
      {block.label}
    </button>
  );
}

function FlowCanvas({
  flow,
  setFlow,
}: {
  flow: FlowBlock[];
  setFlow: React.Dispatch<React.SetStateAction<FlowBlock[]>>;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: blockType,
    drop: (item: FlowBlock) => {
      setFlow((current) => [
        ...current,
        {
          ...item,
          id: `${item.type}-${crypto.randomUUID()}`,
        },
      ]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(ref);

  return (
    <div
      ref={ref}
      className={cn(
        "min-h-54 rounded-md border border-dashed bg-muted/30 p-3 transition",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="space-y-2">
        {flow.map((block, index) => (
          <div key={block.id} className="flex items-center gap-2">
            <div className="flex h-10 flex-1 items-center justify-between rounded-md border bg-background px-3 text-sm">
              <span className="font-medium">{block.label}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {block.type.replace("_", " ")}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${block.label}`}
              onClick={() =>
                setFlow((current) => current.filter((item) => item.id !== block.id))
              }
            >
              <Trash2 className="size-4" />
            </Button>
            {index < flow.length - 1 && <ArrowRight className="size-4 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExistingAutomationCard({
  automation,
  toggleAutomationAction,
  deleteAutomationAction,
}: {
  automation: Automation;
  toggleAutomationAction: AutomationBuilderProps["toggleAutomationAction"];
  deleteAutomationAction: AutomationBuilderProps["deleteAutomationAction"];
}) {
  const flow = parseFlowJson(automation.flowJson);

  return (
    <Card className="glass-card hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 border-b border-border/10 mb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-bold">{automation.name}</CardTitle>
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              automation.isActive
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {automation.isActive ? "Active" : "Paused"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">
            {automation.conditionOperator?.replace("_", " ") ?? "contains"}:{" "}
            <span className="font-mono">{automation.condition || "any message"}</span>
          </p>
          <p className="mt-2 text-muted-foreground">{automation.responseTemplate}</p>
        </div>
        {automation.followUpTemplate && (
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Clock3 className="size-4 text-primary" />
            <span>
              Follow-up after {automation.followUpDelayMinutes ?? 0} minute(s)
            </span>
          </div>
        )}
        {automation.requireFollower && (
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <BellRing className="size-4 text-amber-500" />
            <span>Follower condition required</span>
          </div>
        )}
        {flow.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flow.map((block) => (
              <span key={block.id} className="rounded-md border px-2 py-1 text-xs">
                {block.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <form action={toggleAutomationAction} className="flex-1">
            <input type="hidden" name="id" value={automation.id} />
            <input
              type="hidden"
              name="isActive"
              value={automation.isActive ? "false" : "true"}
            />
            <AnimatedButton type="submit" variant="outline" disableGlow className="w-full">
              {automation.isActive ? "Pause" : "Activate"}
            </AnimatedButton>
          </form>
          <form action={deleteAutomationAction} className="flex-1">
            <input type="hidden" name="id" value={automation.id} />
            <AnimatedButton type="submit" variant="destructive" disableGlow className="w-full">
              <Trash2 className="size-4 mr-2" />
              Delete
            </AnimatedButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutomationBuilder({
  automations: existingAutomations,
  createAutomationAction,
  toggleAutomationAction,
  deleteAutomationAction,
}: AutomationBuilderProps) {
  const [flow, setFlow] = React.useState<FlowBlock[]>(defaultFlow);
  const [selectedOperator, setSelectedOperator] = React.useState("contains");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="glass-card">

          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              Automation Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAutomationAction} className="grid gap-5">
              <input type="hidden" name="flowJson" value={JSON.stringify(flow)} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule name</Label>
                  <Input id="name" name="name" required placeholder="Price inquiry" />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="conditionOperator">Condition</Label>
                  <input type="hidden" name="conditionOperator" value={selectedOperator} />
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-background/50 backdrop-blur-md">
                        {selectedOperator.replace("_", " ")}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                          <DrawerTitle>Select Condition</DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 pb-0 grid gap-2">
                          {conditionOperators.map((operator) => (
                            <DrawerClose asChild key={operator}>
                              <Button 
                                variant={selectedOperator === operator ? "default" : "outline"}
                                className="w-full justify-start"
                                onClick={() => setSelectedOperator(operator)}
                              >
                                {operator.replace("_", " ")}
                              </Button>
                            </DrawerClose>
                          ))}
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Match value</Label>
                <Input id="condition" name="condition" placeholder="price" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseTemplate">Auto message</Label>
                <Textarea
                  id="responseTemplate"
                  name="responseTemplate"
                  required
                  rows={3}
                  placeholder="Thanks for reaching out. Here are the details..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                <div className="space-y-2">
                  <Label htmlFor="followUpTemplate">Follow-up message</Label>
                  <Textarea
                    id="followUpTemplate"
                    name="followUpTemplate"
                    rows={3}
                    placeholder="Just checking if you need anything else."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpDelayMinutes">Delay minutes</Label>
                  <Input
                    id="followUpDelayMinutes"
                    name="followUpDelayMinutes"
                    type="number"
                    min="0"
                    defaultValue="60"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="requireFollower"
                  value="true"
                  className="size-4 rounded border-input"
                />
                Require Instagram follower check before replying
              </label>

              <FlowCanvas flow={flow} setFlow={setFlow} />

              <AnimatedButton type="submit" className="w-full sm:w-fit rounded-full px-8">
                <Plus className="size-4 mr-2" />
                Save automation
              </AnimatedButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {palette.map((block) => (
              <DraggablePaletteBlock key={block.id} block={block} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {existingAutomations.length === 0 ? (
          <Card className="border-dashed p-10 text-center lg:col-span-2">
            <Bot className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No automations saved yet.</p>
          </Card>
        ) : (
          existingAutomations.map((automation) => (
            <ExistingAutomationCard
              key={automation.id}
              automation={automation}
              toggleAutomationAction={toggleAutomationAction}
              deleteAutomationAction={deleteAutomationAction}
            />
          ))
        )}
      </div>
    </DndProvider>
  );
}

