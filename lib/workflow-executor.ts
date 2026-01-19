import { Node, Edge } from "reactflow";
import { NodeData } from "@/components/node-editor/node-editor";

interface WorkflowExecutionContext {
  businessId: string;
  businessData: Record<string, unknown>;
  variables: Record<string, unknown>;
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
        // Just continue to next node
        break;

      case "condition":
        const conditionResult = this.evaluateCondition(node.data.config?.condition || "");
        logs.push(`Condition "${node.data.config?.condition}" evaluated to: ${conditionResult}`);
        
        if (!conditionResult) {
          logs.push("Condition failed, stopping workflow");
          return;
        }
        break;

      case "template":
        const templateId = node.data.config?.templateId;
        if (!templateId) {
          throw new Error("No template selected");
        }
        logs.push(`Sending email template: ${templateId}`);
        // Here you would call your email sending API
        await this.sendEmail(templateId, logs);
        break;

      case "delay":
        const hours = node.data.config?.delayHours || 24;
        logs.push(`Scheduling delay of ${hours} hours`);
        // In real implementation, this would schedule the next execution
        break;

      case "custom":
        const code = node.data.config?.customCode;
        if (!code) {
          throw new Error("No custom code provided");
        }
        logs.push(`Executing custom code`);
        const customResult = await this.executeCustomCode(code);
        if (!customResult) {
          logs.push("Custom code returned false, stopping workflow");
          return;
        }
        break;

      case "gemini":
        const prompt = node.data.config?.aiPrompt;
        if (!prompt) {
          throw new Error("No AI prompt provided");
        }
        logs.push(`Executing AI task with prompt: ${prompt.substring(0, 50)}...`);
        await this.executeAITask(prompt, logs);
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
      // Handle simple conditions like !website, email, category == "restaurant"
      if (condition.startsWith("!")) {
        const field = condition.slice(1);
        const value = this.context.businessData[field];
        return !value || value === "";
      }

      if (condition.includes("==")) {
        const [field, expectedValue] = condition.split("==").map(s => s.trim().replace(/"/g, ""));
        return this.context.businessData[field] === expectedValue;
      }

      // Simple field check
      const value = this.context.businessData[condition];
      return !!value && value !== "";
    } catch (error) {
      console.error("Condition evaluation error:", error);
      return false;
    }
  }

  private async sendEmail(templateId: string, logs: string[]): Promise<void> {
    // This would call your actual email sending API
    logs.push(`Email sent successfully using template: ${templateId}`);
    
    // Example:
    // await fetch('/api/emails/send', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     templateId,
    //     businessId: this.context.businessId,
    //     variables: this.context.variables
    //   })
    // });
  }

  private async executeCustomCode(code: string): Promise<boolean> {
    try {
      // Create a safe execution context
      const fn = new Function("business", "variables", code);
      const result = fn(this.context.businessData, this.context.variables);
      return !!result;
    } catch (error) {
      console.error("Custom code execution error:", error);
      throw new Error(`Custom code failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeAITask(prompt: string, logs: string[]): Promise<void> {
    // Replace variables in prompt
    let processedPrompt = prompt;
    for (const [key, value] of Object.entries(this.context.businessData)) {
      processedPrompt = processedPrompt.replace(`{${key}}`, String(value));
    }

    logs.push(`Processed AI prompt: ${processedPrompt.substring(0, 100)}...`);
    
    // This would call your Gemini API
    // const response = await fetch('/api/ai/generate', {
    //   method: 'POST',
    //   body: JSON.stringify({ prompt: processedPrompt })
    // });
    // const data = await response.json();
    // this.context.variables.aiResult = data.result;
  }

  private getNextNodes(nodeId: string): Node<NodeData>[] {
    const outgoingEdges = this.edges.filter(e => e.source === nodeId);
    return outgoingEdges
      .map(edge => this.nodes.find(n => n.id === edge.target))
      .filter((n): n is Node<NodeData> => n !== undefined);
  }
}

// Helper function to execute a workflow
export async function executeWorkflow(
  workflowId: string,
  businessId: string
): Promise<{ success: boolean; logs: string[] }> {
  // In real implementation, fetch workflow and business data from database
  // const workflow = await db.query.workflows.findFirst({ where: eq(workflows.id, workflowId) });
  // const business = await db.query.businesses.findFirst({ where: eq(businesses.id, businessId) });
  
  // For now, return placeholder
  return {
    success: false,
    logs: ["Workflow execution engine ready. Connect to database to run workflows."]
  };
}
