import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Node, Edge } from "reactflow";
import { NodeData } from "./node-editor";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "simple-follow-up",
    name: "Simple Follow-up",
    description: "Send an initial email, wait 3 days, then send a follow-up",
    nodes: [
      {
        id: "start-1",
        type: "workflowNode",
        data: { label: "Start", type: "start", config: {} },
        position: { x: 250, y: 50 },
      },
      {
        id: "template-1",
        type: "workflowNode",
        data: { label: "Initial Email", type: "template", config: { templateId: "template-1" } },
        position: { x: 250, y: 150 },
      },
      {
        id: "delay-1",
        type: "workflowNode",
        data: { label: "Wait 3 Days", type: "delay", config: { delayHours: 72 } },
        position: { x: 250, y: 250 },
      },
      {
        id: "template-2",
        type: "workflowNode",
        data: { label: "Follow-up Email", type: "template", config: { templateId: "template-2" } },
        position: { x: 250, y: 350 },
      },
    ],
    edges: [
      { id: "e1-2", source: "start-1", target: "template-1" },
      { id: "e2-3", source: "template-1", target: "delay-1" },
      { id: "e3-4", source: "delay-1", target: "template-2" },
    ],
  },
  {
    id: "conditional-outreach",
    name: "Conditional Outreach",
    description: "Check if business has website, send different emails based on result",
    nodes: [
      {
        id: "start-1",
        type: "workflowNode",
        data: { label: "Start", type: "start", config: {} },
        position: { x: 300, y: 50 },
      },
      {
        id: "condition-1",
        type: "workflowNode",
        data: { label: "Has Website?", type: "condition", config: { condition: "website" } },
        position: { x: 300, y: 150 },
      },
      {
        id: "template-1",
        type: "workflowNode",
        data: { label: "With Website Email", type: "template", config: { templateId: "template-1" } },
        position: { x: 150, y: 250 },
      },
      {
        id: "template-2",
        type: "workflowNode",
        data: { label: "No Website Email", type: "template", config: { templateId: "template-3" } },
        position: { x: 450, y: 250 },
      },
    ],
    edges: [
      { id: "e1-2", source: "start-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "template-1", label: "Yes" },
      { id: "e2-4", source: "condition-1", target: "template-2", label: "No" },
    ],
  },
  {
    id: "ai-personalized",
    name: "AI Personalized Outreach",
    description: "Use AI to generate personalized content before sending",
    nodes: [
      {
        id: "start-1",
        type: "workflowNode",
        data: { label: "Start", type: "start", config: {} },
        position: { x: 250, y: 50 },
      },
      {
        id: "gemini-1",
        type: "workflowNode",
        data: { 
          label: "Generate Personalization", 
          type: "gemini", 
          config: { aiPrompt: "Generate a personalized opening line for {brand_name} in the {category} industry" } 
        },
        position: { x: 250, y: 150 },
      },
      {
        id: "template-1",
        type: "workflowNode",
        data: { label: "Send Email", type: "template", config: { templateId: "template-1" } },
        position: { x: 250, y: 250 },
      },
      {
        id: "delay-1",
        type: "workflowNode",
        data: { label: "Wait 5 Days", type: "delay", config: { delayHours: 120 } },
        position: { x: 250, y: 350 },
      },
      {
        id: "template-2",
        type: "workflowNode",
        data: { label: "Follow-up", type: "template", config: { templateId: "template-2" } },
        position: { x: 250, y: 450 },
      },
    ],
    edges: [
      { id: "e1-2", source: "start-1", target: "gemini-1" },
      { id: "e2-3", source: "gemini-1", target: "template-1" },
      { id: "e3-4", source: "template-1", target: "delay-1" },
      { id: "e4-5", source: "delay-1", target: "template-2" },
    ],
  },
  {
    id: "blank",
    name: "Blank Workflow",
    description: "Start from scratch with just a start node",
    nodes: [
      {
        id: "start-1",
        type: "workflowNode",
        data: { label: "Start", type: "start", config: {} },
        position: { x: 250, y: 100 },
      },
    ],
    edges: [],
  },
];

interface WorkflowTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (nodes: Node<NodeData>[], edges: Edge[]) => void;
}

export function WorkflowTemplatesDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: WorkflowTemplatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built workflow template to get started quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card 
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelectTemplate(template.nodes, template.edges)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>{template.nodes.length} nodes • {template.edges.length} connections</p>
                </div>
                <Button className="w-full mt-3" size="sm">
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
