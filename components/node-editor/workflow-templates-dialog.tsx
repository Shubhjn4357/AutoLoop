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
    id: "scraped-email-automation",
    name: "Auto Email from Scraper",
    description: "Process scraped data, cleaner info, check for website, and send specific email.",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Start", type: "start", config: {} }, position: { x: 300, y: 50 }, },
      { id: "cond", type: "workflowNode", data: { label: "Has Website?", type: "condition", config: { condition: "business.website" } }, position: { x: 300, y: 150 }, },
      // Yes Path: Fetch -> Extract -> Send
      { id: "fetch", type: "workflowNode", data: { label: "Fetch Website", type: "scraper", config: { scraperAction: "fetch-url", scraperInputField: "{business.website}" } }, position: { x: 100, y: 300 }, },
      { id: "extract", type: "workflowNode", data: { label: "Extract Info", type: "scraper", config: { scraperAction: "extract-emails", scraperInputField: "{variables.scrapedData}" } }, position: { x: 100, y: 450 }, },
      { id: "send-custom", type: "workflowNode", data: { label: "Send Personalized", type: "template", config: { templateId: "template-1" } }, position: { x: 100, y: 600 }, },
      // No Path: Generic Send
      { id: "send-generic", type: "workflowNode", data: { label: "Send Generic", type: "template", config: { templateId: "template-2" } }, position: { x: 500, y: 300 }, },
    ],
    edges: [
      { id: "e1-cond", source: "1", target: "cond" },
      // Yes branch
      { id: "e-yes-1", source: "cond", target: "fetch", sourceHandle: "true", label: "Yes" },
      { id: "e-yes-2", source: "fetch", target: "extract" },
      { id: "e-yes-3", source: "extract", target: "send-custom" },
      // No branch
      { id: "e-no-1", source: "cond", target: "send-generic", sourceHandle: "false", label: "No" },
    ],
  },
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
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Score leads based on email domain and enrich data",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Start", type: "start" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Check Corporate Email", type: "condition", config: { condition: "!email.includes('gmail.com')" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Enrich Company Data", type: "apiRequest", config: { url: "https://api.enrichment.com/v1/company", method: "GET" } }, position: { x: -100, y: 300 } },
      { id: "4", type: "workflowNode", data: { label: "Low Priority Tag", type: "set", config: { setVariables: { priority: "low" } } }, position: { x: 200, y: 300 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3", label: "Yes" },
      { id: "e2-4", source: "2", target: "4", label: "No" },
    ]
  },
  {
    id: "customer-onboarding",
    name: "Customer Onboarding",
    description: "Multi-step onboarding drip campaign",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "New User Signup", type: "webhook", config: { webhookMethod: "POST" } }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Welcome Email", type: "template", config: { templateId: "welcome" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Wait 1 Day", type: "delay", config: { delayHours: 24 } }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Check Activation", type: "condition", config: { condition: "user.activated" } }, position: { x: 50, y: 350 } },
      { id: "5", type: "workflowNode", data: { label: "Getting Started Guide", type: "template", config: { templateId: "guide" } }, position: { x: -100, y: 450 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
      { id: "e4-5", source: "4", target: "5", label: "No" },
    ]
  },
  {
    id: "feedback-collection",
    name: "Feedback Collection",
    description: "Collect feedback after service delivery",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Service Completed", type: "start" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Wait 2 Hours", type: "delay", config: { delayHours: 2 } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Send Survey", type: "template", config: { templateId: "survey" } }, position: { x: 50, y: 250 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
    ]
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "Recover lost sales with automated reminders",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Cart Abandoned", type: "webhook" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Wait 1 Hour", type: "delay", config: { delayHours: 1 } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Reminder Email", type: "template", config: { templateId: "cart_reminder" } }, position: { x: 50, y: 250 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
    ]
  },
  {
    id: "weekly-report",
    name: "Weekly Report Generator",
    description: "Generate and email weekly summaries every Monday",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Every Monday 9AM", type: "schedule", config: { scheduleCron: "0 9 * * 1" } }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Fetch Analytics", type: "apiRequest", config: { url: "/api/stats", method: "GET" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Generate Summary (AI)", type: "gemini", config: { aiPrompt: "Summarize these stats: {data}" } }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Email Team", type: "template", config: { templateId: "weekly_report" } }, position: { x: 50, y: 350 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ]
  },
  {
    id: "social-media-post",
    name: "Social Media Auto-Post",
    description: "Post new blog articles to social media automatically",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "New Blog Post", type: "webhook" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Generate Tweet", type: "gemini", config: { aiPrompt: "Write a tweet for this article: {title}" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Post to Twitter", type: "apiRequest", config: { url: "https://api.twitter.com/post", method: "POST" } }, position: { x: 50, y: 250 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
    ]
  },
  {
    id: "invoice-processing",
    name: "Invoice Processing Agent",
    description: "Extract data from invoices and update accounting",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "New Invoice Email", type: "webhook" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Extract Details", type: "agent", config: { agentPrompt: "Extract amount, date, vendor" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Wait for Approval", type: "delay", config: { delayHours: 4 } }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Update CRM", type: "apiRequest", config: { url: "/api/crm", method: "POST" } }, position: { x: 50, y: 350 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ]
  },
  {
    id: "webinar-reminder",
    name: "Webinar Attendance Reminder",
    description: "Remind registrants 1 hour before event",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "1 Hour Before", type: "schedule", config: { scheduleCron: "0 10 * * *" } }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Get Registrants", type: "apiRequest", config: { url: "/api/webinar/users", method: "GET" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Process List", type: "splitInBatches" }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Send Reminder", type: "template", config: { templateId: "webinar_start" } }, position: { x: 50, y: 350 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ]
  },
  {
    id: "support-ticket-routing",
    name: "Support Ticket Routing",
    description: "Route support tickets based on keyword analysis",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "New Ticket", type: "webhook" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Analyze Sentiment", type: "gemini", config: { aiPrompt: "Is this urgent? {message}" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Urgent?", type: "condition", config: { condition: "analysis.contains('urgent')" } }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Alert Manager", type: "apiRequest", config: { url: "/api/slack/alert", method: "POST" } }, position: { x: -50, y: 350 } },
      { id: "5", type: "workflowNode", data: { label: "Auto-Reply", type: "template", config: { templateId: "received" } }, position: { x: 150, y: 350 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4", label: "Yes" },
      { id: "e3-5", source: "3", target: "5", label: "No" },
    ]
  },
  {
    id: "data-enrichment",
    name: "Data Enrichment Pipeline",
    description: "Enrich user profiles from Clearbit/Apollo",
    nodes: [
      { id: "1", type: "workflowNode", data: { label: "Start", type: "start" }, position: { x: 50, y: 50 } },
      { id: "2", type: "workflowNode", data: { label: "Fetch Clearbit", type: "apiRequest", config: { url: "https://person.clearbit.com/v2/people/find", method: "GET" } }, position: { x: 50, y: 150 } },
      { id: "3", type: "workflowNode", data: { label: "Merge Data", type: "merge" }, position: { x: 50, y: 250 } },
      { id: "4", type: "workflowNode", data: { label: "Update Profile", type: "apiRequest", config: { url: "/api/profile", method: "PUT" } }, position: { x: 50, y: 350 } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ]
  }
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
