import { Node, Edge } from "reactflow";
import { NodeData } from "@/components/node-editor/node-editor";
import { db } from "@/db";
import { businesses, emailTemplates, emailLogs, automationWorkflows, users } from "@/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendEmail, interpolateTemplate } from "@/lib/email";
import { Business } from "@/types";
import { eq, and } from "drizzle-orm";

interface WorkflowExecutionContext {
  businessId: string;
  businessData: Record<string, unknown>;
  variables: Record<string, unknown>;
  userId: string;
}

export class WorkflowExecutor {
  private nodes: Node<NodeData>[];
  private edges: Edge[];
  private context: WorkflowExecutionContext;

  constructor(nodes: Node<NodeData>[], edges: Edge[], context: WorkflowExecutionContext) {
    this.nodes = nodes;
    this.edges = edges;
    this.context = context;
  }

  async execute(): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = [];
    
    // Find start node
    const startNode = this.nodes.find(n => n.data.type === "start");
    if (!startNode) {
      return { success: false, logs: ["Error: No start node found"] };
    }

    logs.push(`Starting workflow execution for business: ${this.context.businessId}`);
    
    try {
      await this.executeNode(startNode, logs);
      return { success: true, logs };
    } catch (error) {
      logs.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, logs };
    }
  }

  private async executeNode(node: Node<NodeData>, logs: string[]): Promise<void> {
    logs.push(`Executing ${node.data.type} node: ${node.data.label}`);

    switch (node.data.type) {
      case "start":
        break;

      case "condition":
        const conditionResult = this.evaluateCondition(node.data.config?.condition || "");
        logs.push(`Condition "${node.data.config?.condition}" evaluated to: ${conditionResult}`);
        if (!conditionResult) {
          logs.push("Condition failed, stopping branch");
          return;
        }
        break;

      case "template":
        const templateId = node.data.config?.templateId;
        if (!templateId) {
          throw new Error("No template selected");
        }
        logs.push(`Processing email template: ${templateId}`);
        await this.sendEmail(templateId, logs);
        break;

      case "delay":
        const hours = node.data.config?.delayHours || 24;
        logs.push(`Scheduling delay of ${hours} hours (Simulated for immediate execution in this version)`);
        // For real background jobs, we would enqueue a delayed job here and return.
        // For this "loop" implementation, we might just log it.
        break;

      case "custom":
        const code = node.data.config?.customCode;
        if (!code) throw new Error("No custom code provided");
        logs.push(`Executing custom code`);
        const customResult = await this.executeCustomCode(code);
        if (!customResult) {
          logs.push("Custom code returned false, stopping branch");
          return;
        }
        break;

      case "gemini":
      case "agent":
        const prompt = node.data.type === "agent" ? node.data.config?.agentPrompt : node.data.config?.aiPrompt;
        const contextData = node.data.config?.agentContext;
        if (!prompt) throw new Error("No AI prompt provided");

        logs.push(`Executing AI Agent...`);
        await this.executeAITask(prompt, contextData, logs);
        break;

      case "apiRequest":
        await this.executeApiRequest(node.data.config, logs);
        break;
    }

    // Find and execute next nodes
    const nextNodes = this.getNextNodes(node.id);
    for (const nextNode of nextNodes) {
      await this.executeNode(nextNode, logs);
    }
  }

  private evaluateCondition(condition: string): boolean {
    try {
      if (condition.startsWith("!")) {
        const field = condition.slice(1);
        const value = this.context.businessData[field];
        return !value || value === "";
      }
      if (condition.includes("==")) {
        const [field, expectedValue] = condition.split("==").map(s => s.trim().replace(/"/g, ""));
        return String(this.context.businessData[field]) === expectedValue;
      }
      const value = this.context.businessData[condition];
      return !!value && value !== "";
    } catch (error) {
      console.error("Condition evaluation error:", error);
      return false;
    }
  }

  private async sendEmail(templateId: string, logs: string[]): Promise<void> {
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.id, templateId)
    });
    
    if (!template) {
      logs.push(`Error: Template ${templateId} not found`);
      return;
    }

    // Get user access token for Gmail
    const user = await db.query.users.findFirst({
      where: eq(users.id, this.context.userId)
    });

    if (!user || !user.accessToken) {
      logs.push("Error: User access token not found. Please re-authenticate with Google.");
      return;
    }

    // Prepare content
    const subject = interpolateTemplate(template.subject, this.context.businessData as unknown as Business);
    const body = interpolateTemplate(template.body, this.context.businessData as unknown as Business);

    logs.push(`Sending email to ${this.context.businessData.email} with subject: ${subject}`);

    // Send email using real Gmail API
    const success = await sendEmail({
      to: this.context.businessData.email as string,
      subject,
      body,
      accessToken: user.accessToken
    });

    if (success) {
      // Mark business as sent
      await db.update(businesses)
        .set({
          emailSent: true,
          emailStatus: "sent",
          emailSentAt: new Date()
        })
        .where(eq(businesses.id, this.context.businessId));

      logs.push("Email sent successfully!");
    } else {
      await db.update(businesses)
        .set({
          emailStatus: "failed",
        })
        .where(eq(businesses.id, this.context.businessId));

      logs.push("Failed to send email.");
    }

    // Log the email attempt
    await db.insert(emailLogs).values({
      userId: this.context.userId,
      businessId: this.context.businessId,
      templateId: template.id,
      status: success ? "sent" : "failed",
      subject,
      body,
      sentAt: success ? new Date() : null,
    });
  }

  private async executeCustomCode(code: string): Promise<boolean> {
    try {
      const fn = new Function("company", "variables", code);
      const result = fn(this.context.businessData, this.context.variables);
      return !!result;
    } catch (error) {
      throw new Error(`Custom code failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeAITask(prompt: string, contextData: string | undefined, logs: string[]): Promise<void> {
    let processedPrompt = prompt;
    for (const [key, value] of Object.entries(this.context.businessData)) {
      processedPrompt = processedPrompt.replace(`{${key}}`, String(value || ""));
    }

    if (contextData) {
      processedPrompt += `\n\nContext Data:\n${contextData}`;
    }

    // Try to get API key from user in DB (assuming stored in env or user record)
    // For now assuming env or we skip if no key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logs.push("Warning: No Gemini API Key found, skipping AI generation");
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(processedPrompt);
      const response = result.response;
      const text = response.text();
      logs.push(`AI Response: ${text.substring(0, 100)}...`);
      this.context.variables.aiResult = text;
    } catch (e) {
      logs.push(`AI Error: ${e}`);
    }
  }

  private async executeApiRequest(config: NodeData["config"], logs: string[]): Promise<void> {
    if (!config?.url) return;

    logs.push(`Making ${config.method} request to ${config.url}`);
    try {
      const headers = config.headers ? JSON.parse(config.headers) : {};
      const body = config.body ? config.body : undefined;

      const response = await fetch(config.url, {
        method: config.method || "GET",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: config.method !== "GET" ? body : undefined
      });

      const text = await response.text();
      logs.push(`API Response Status: ${response.status}`);
      this.context.variables.apiResponse = text;
    } catch (e) {
      logs.push(`API Request Failed: ${e}`);
    }
  }

  private getNextNodes(nodeId: string): Node<NodeData>[] {
    const outgoingEdges = this.edges.filter(e => e.source === nodeId);
    return outgoingEdges
      .map(edge => this.nodes.find(n => n.id === edge.target))
      .filter((n): n is Node<NodeData> => n !== undefined);
  }
}

// Function to execute a workflow for all pending businesses
export async function executeWorkflowLoop(
  workflowId: string,
  userId: string
): Promise<{ success: boolean; totalProcessed: number; logs: string[] }> {
  const workflow = await db.query.automationWorkflows.findFirst({
    where: eq(automationWorkflows.id, workflowId)
  });

  if (!workflow) {
    return { success: false, totalProcessed: 0, logs: ["Workflow not found"] };
  }

  // Get pending businesses (not sent)
  const pendingBusinesses = await db.query.businesses.findMany({
    where: and(
      eq(businesses.userId, userId),
      eq(businesses.emailSent, false)
    ),
    limit: 5 // LIMIT to 5 for safety in this demo, or remove limit for full loop
  });

  const allLogs: string[] = [];
  let processed = 0;

  allLogs.push(`Found ${pendingBusinesses.length} pending businesses`);

  for (const business of pendingBusinesses) {
    allLogs.push(`--- Processing ${business.name} ---`);

    // Check if keywords match (if defined in workflow) or if generic
    // Simplify for now: Run for all pending

    const executor = new WorkflowExecutor(
      workflow.nodes as Node<NodeData>[],
      workflow.edges as Edge[],
      {
        businessId: business.id,
        businessData: business as unknown as Record<string, unknown>,
        variables: {},
        userId
      }
    );

    const result = await executor.execute();
    allLogs.push(...result.logs);
    if (result.success) processed++;
  }

  return { success: true, totalProcessed: processed, logs: allLogs };
}
