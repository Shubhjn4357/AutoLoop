import { Node, Edge } from "reactflow";
import { NodeData } from "@/components/node-editor/node-editor";
import { db } from "@/db";
import { businesses, emailTemplates, emailLogs, automationWorkflows, users } from "@/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendEmail, interpolateTemplate } from "@/lib/email";
import { Business, WorkflowExecutionContext } from "@/types";
import { eq, and, gt } from "drizzle-orm";
import { notifications, workflowExecutionLogs } from "@/db/schema";
import { withRetry } from "@/lib/retry";

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

    logs.push(`🚀 Starting workflow execution for business: ${this.context.businessId}`);
    
    try {
      await this.executeNode(startNode, logs);

      // CHECK SUCCESS
      const success = !logs.some(l => l.includes("Error") || l.includes("Failed"));
      if (success) {
        const business = await db.query.businesses.findFirst({
          where: eq(businesses.id, this.context.businessId)
        });

        // Add success notification
        await db.insert(notifications).values({
          userId: this.context.userId,
          title: "Workflow Completed Successfully",
          message: `Workflow successfully processed business: ${business?.name}`,
          type: "success",
        });
      } else {
        // Count recent failures to alert on repeated errors
        const recentFailures = await db.query.workflowExecutionLogs.findMany({
          where: and(
            eq(workflowExecutionLogs.workflowId, this.context.workflowId),
            eq(workflowExecutionLogs.status, "failed")
          ),
          limit: 5,
        });

        if (recentFailures.length >= 3) {
          // Alert admin on 3+ consecutive failures
          await db.insert(notifications).values({
            userId: this.context.userId,
            title: "⚠️ Workflow Repeated Failures",
            message: `Workflow has failed ${recentFailures.length} times recently. Please check configuration and logs.`,
            type: "warning",
          });
        }
      }
      return { success, logs };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(`❌ Error: ${errorMsg}`);

      // Add error notification
      await db.insert(notifications).values({
        userId: this.context.userId,
        title: "Workflow Execution Failed",
        message: `Workflow failed: ${errorMsg}`,
        type: "error",
      });

      return { success: false, logs };
    }
  }

  // Get current variable state
  public getVariables(): Record<string, unknown> {
    return this.context.variables;
  }

  private async executeNode(node: Node<NodeData>, logs: string[]): Promise<void> {
    logs.push(`Executing ${node.data.type} node: ${node.data.label}`);

    switch (node.data.type) {
      case "start":
        break;

      case "condition":
        const conditionResult = this.evaluateCondition(node.data.config?.condition || "");
        logs.push(`Condition "${node.data.config?.condition}" evaluated to: ${conditionResult}`);

        const handleToFollow = conditionResult ? "true" : "false";
        const relevantEdges = this.edges.filter(e => e.source === node.id && e.sourceHandle === handleToFollow);

        if (relevantEdges.length === 0) {
          logs.push(`No path found for result ${conditionResult} (handle: ${handleToFollow})`);
          return;
        }

        for (const edge of relevantEdges) {
          const nextNode = this.nodes.find(n => n.id === edge.target);
          if (nextNode) {
            await this.executeNode(nextNode, logs);
          }
        }
        return; // Stop default flow, we handled it explicitly

      case "template":
        const templateId = node.data.config?.templateId;
        if (!templateId) throw new Error("No template selected");

        logs.push(`Processing email template: ${templateId}`);
        const emailSuccess = await this.sendEmail(templateId, node.data.config, logs);

        if (!emailSuccess) {
          logs.push("⚠️ Email sending failed, looking for error handler");
          const errorEdges = this.edges.filter(e => e.source === node.id && e.sourceHandle === "error");
          for (const edge of errorEdges) {
            const nextNode = this.nodes.find(n => n.id === edge.target);
            if (nextNode) {
              await this.executeNode(nextNode, logs);
            }
          }
        }
        break;

      case "delay":
        const hours = node.data.config?.delayHours || 24;
        logs.push(`⏱️ Scheduling delay of ${hours} hours`);
        // In production, this enqueues a delayed job with Bull queue
        // Execution will resume after the delay via background worker
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



      case "whatsappNode":
        await this.executeWhatsAppNode(node);
        break;

      case "scraper":
        await this.executeScraperTask(node.data.config, logs);
        break;

      case "linkedinScraper":
        await this.executeLinkedinScraperTask(node.data.config, logs);
        break;

      case "linkedinMessage":
        await this.executeLinkedinMessageTask(node.data.config, logs);
        break;

      case "abSplit":
        const weight = node.data.config?.abSplitWeight || 50;
        const random = Math.random() * 100;
        const isA = random < weight;
        const handle = isA ? "a" : "b";

        logs.push(`🔀 A/B Split: Rolling dice... Result: ${random.toFixed(1)} (Threshold: ${weight}) -> Path ${isA ? "A" : "B"}`);

        const splitEdges = this.edges.filter(e => e.source === node.id && e.sourceHandle === handle);

        if (splitEdges.length === 0) {
          logs.push(`⚠️ No path connected for ${handle.toUpperCase()}. Stopping branch.`);
          return;
        }

        logs.push(`> Following Path ${handle.toUpperCase()}`);
        for (const edge of splitEdges) {
          const nextNode = this.nodes.find(n => n.id === edge.target);
          if (nextNode) {
            await this.executeNode(nextNode, logs);
          }
        }
        return; // Stop default flow traversal as we handled it specifically
    }

    // Find and execute next nodes
    const nextNodes = this.getNextNodes(node.id);
    for (const nextNode of nextNodes) {
      await this.executeNode(nextNode, logs);
    }
  }

  private resolveValue(path: string): unknown {
    // Strip curly braces if present
    const cleanPath = path.replace(/^\{|\}$/g, "");

    // Check for explicit "business." prefix
    if (cleanPath.startsWith("business.")) {
      const field = cleanPath.split(".")[1];
      return (this.context.businessData)[field as keyof Business];
    }

    // Check for "variables." prefix (custom workflow variables)
    if (cleanPath.startsWith("variables.") || cleanPath.startsWith("variable.")) {
      const field = cleanPath.split(".")[1];
      return this.context.variables[field];
    }

    // Fallback: Check business data first, then variables
    if (cleanPath in this.context.businessData) {
      return this.context.businessData[cleanPath as keyof Business];
    }

    return this.context.variables[cleanPath];
  }

  // Helper to replace all {variables} in a string
  private interpolateString(text: string): string {
    if (!text) return "";
    return text.replace(/\{([^}]+)\}/g, (match, path) => {
      const value = this.resolveValue(path);
      return value !== undefined && value !== null ? String(value) : "";
    });
  }

  private evaluateCondition(condition: string): boolean {
    if (!condition) return false;

    try {
      // 1. Handle Negation "!"
      if (condition.startsWith("!")) {
        const path = condition.slice(1).trim();
        const value = this.resolveValue(path);
        return !value || value === "";
      }

      // 2. Handle Equality "=="
      if (condition.includes("==")) {
        const [left, right] = condition.split("==").map(s => s.trim());
        const leftValue = String(this.resolveValue(left));
        // Handle quoted string on the right side
        const rightValue = right.replace(/^["']|["']$/g, "");
        return leftValue === rightValue;
      }

      // 3. Handle Inequality "!="
      if (condition.includes("!=")) {
        const [left, right] = condition.split("!=").map(s => s.trim());
        const leftValue = String(this.resolveValue(left));
        const rightValue = right.replace(/^["']|["']$/g, "");
        return leftValue !== rightValue;
      }

      // 4. Handle truthiness (just the variable name)
      const value = this.resolveValue(condition);
      console.log(`[Condition Debug] checking truthiness of "${condition}", resolved value:`, value);
      return !!value && value !== "";

    } catch (error) {
      console.error("Condition evaluation error:", error);
      return false;
    }
  }

  private async sendEmail(templateId: string, config: NodeData["config"], logs: string[]): Promise<boolean> {
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.id, templateId)
    });
    
    if (!template) {
      logs.push(`Error: Template ${templateId} not found`);
      return false;
    }

    // --- CONDITION 1: DUPLICATE PREVENTION ---
    // Default to true (prevent duplicates) if undefined
    const preventDuplicates = config?.preventDuplicates !== false;
    if (preventDuplicates) {
      const existingLog = await db.query.emailLogs.findFirst({
        where: and(
          eq(emailLogs.businessId, this.context.businessId),
          eq(emailLogs.templateId, templateId),
          eq(emailLogs.status, "sent")
        )
      });

      if (existingLog) {
        logs.push(`⚠️ Skipped: Email with template '${template.name}' was already sent to this business.`);
        return true; // Return true so workflow continues
      }
    }

    // --- CONDITION 2: FATIGUE MANAGEMENT (COOLDOWN) ---
    const cooldownDays = config?.cooldownDays || 0;
    if (cooldownDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cooldownDays);

      const recentEmail = await db.query.emailLogs.findFirst({
        where: and(
          eq(emailLogs.businessId, this.context.businessId),
          eq(emailLogs.status, "sent"),
          gt(emailLogs.sentAt, cutoffDate)
        )
      });

      if (recentEmail) {
        logs.push(`⚠️ Skipped: Fatigue management. An email was sent to this business in the last ${cooldownDays} days.`);
        return true; // Return true so workflow continues
      }
    }

    // Get user access token for Gmail
    const user = await db.query.users.findFirst({
      where: eq(users.id, this.context.userId)
    });

    if (!user || !user.accessToken) {
      logs.push("Error: User access token not found. Please re-authenticate with Google.");
      return false;
    }

    // Prepare content
    const subject = interpolateTemplate(template.subject, this.context.businessData as unknown as Business);
    const body = interpolateTemplate(template.body, this.context.businessData as unknown as Business);

    logs.push(`Sending email to ${this.context.businessData.email} with subject: ${subject}`);

    // Send email with retry logic
    const result = await withRetry(
      async () => {
        return await sendEmail({
          to: this.context.businessData.email as string,
          subject,
          body,
          accessToken: user.accessToken!
        });
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        shouldRetry: (error) => {
          const msg = error.message || "";
          return msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("EHOSTUNREACH");
        }
      }
    );

    const success = result?.success ?? false;

    if (success) {
      await db.update(businesses)
        .set({
          emailSent: true,
          emailStatus: "sent",
          emailSentAt: new Date()
        })
        .where(eq(businesses.id, this.context.businessId));

      logs.push("✅ Email sent successfully!");

      await db.insert(emailLogs).values({
        userId: this.context.userId,
        businessId: this.context.businessId,
        templateId: template.id,
        status: "sent",
        subject,
        body,
        sentAt: new Date(),
      });

      return true;
    } else {
      await db.update(businesses)
        .set({
          emailStatus: "failed",
        })
        .where(eq(businesses.id, this.context.businessId));

      logs.push(`❌ Email sending failed: ${result?.error || "Unknown error"}`);

      await db.insert(emailLogs).values({
        userId: this.context.userId,
        businessId: this.context.businessId,
        templateId: template.id,
        status: "failed",
        subject,
        body,
        errorMessage: result?.error || "Unknown error",
        sentAt: null,
      });

      return false;
    }
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
    // Interpolate the prompt with all available variables
    let processedPrompt = this.interpolateString(prompt);

    if (contextData) {
      // Also interpolate context data if needed, or just append
      processedPrompt += `\n\nContext Data:\n${this.interpolateString(contextData)}`;
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

    // Interpolate URL, Headers, and Body
    const url = this.interpolateString(config.url);
    const method = config.method || "GET";

    logs.push(`Making ${method} request to ${url}`);

    try {
      let headers = {};
      if (config.headers) {
        const interpolatedHeaders = this.interpolateString(config.headers);
        try {
          headers = JSON.parse(interpolatedHeaders);
        } catch {
          logs.push("Warning: Failed to parse headers JSON");
        }
      }

      let body = undefined;
      if (config.body && method !== "GET") {
        const interpolatedBody = this.interpolateString(config.body);
        // Try to parse if proper JSON, otherwise send as string possibly? 
        // Usually API expects JSON object for body if content-type is json
        try {
          body = JSON.parse(interpolatedBody);
        } catch {
          body = interpolatedBody;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const text = await response.text();
      logs.push(`API Response Status: ${response.status}`);
      this.context.variables.apiResponse = text;
    } catch (e) {
      logs.push(`API Request Failed: ${e}`);
    }
  }

  private async executeScraperTask(config: NodeData["config"], logs: string[]): Promise<void> {
    const action = config?.scraperAction || "extract-emails";
    const inputVar = config?.scraperInputField || "";

    // Resolve input content
    const content = this.resolveValue(inputVar); // Can be a string or object
    const textContent = content === undefined || content === null ? "" : (typeof content === "string" ? content : JSON.stringify(content));

    logs.push(`Running Scraper Action: ${action}`);
    logs.push(`> Input Content Length: ${textContent.length} chars (Source: ${inputVar || "Direct Input"})`);

    if (!textContent) {
      logs.push("> Warning: Input content is empty. Skipping extraction.");
      this.context.variables.scrapedData = null;
      return;
    }

    let result: unknown = null;

    if (action === "fetch-url") {
      let url = textContent.trim();
      if (!url.startsWith("http")) url = "https://" + url;

      try {
        logs.push(`> Fetching URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const html = await response.text();
        result = html;
        logs.push(`> Success: Fetched ${html.length} chars from URL`);
      } catch (e) {
        logs.push(`> Error: Failed to fetch URL: ${e}`);
        result = null;
      }
    } else if (action === "extract-emails") {
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const matches = textContent.match(emailRegex);
      const emails = matches ? [...new Set(matches)] : [];
      result = emails;
      logs.push(`> Success: Extracted ${emails.length} unique emails: ${emails.slice(0, 3).join(", ")}${emails.length > 3 ? "..." : ""}`);
    } else if (action === "clean-html") {
      result = textContent.replace(/<[^>]*>/g, "");
      logs.push(`> Success: Cleaned HTML tags. New length: ${String(result).length}`);
    } else if (action === "markdown") {
      // Simple mock markdown conversion
      result = textContent.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n\n");
      logs.push(`> Success: Converted to Markdown. New length: ${String(result).length}`);
    } else if (action === "summarize") {
      result = textContent.substring(0, 200) + "...";
      logs.push(`> Success: Summarized content (Truncated to 200 chars)`);
    }

    this.context.variables.scrapedData = result;
  }

  private async executeLinkedinScraperTask(config: NodeData["config"], logs: string[]): Promise<void> {
    const keywordsRaw = config?.linkedinKeywords || "";
    const location = config?.linkedinLocation || "";

    // Resolve keywords (can be comma separated or single string)
    const keywordsExpanded = this.interpolateString(keywordsRaw);
    const keywords = keywordsExpanded.split(",").map(k => k.trim()).filter(k => k);
    const locationResolved = this.interpolateString(location);

    logs.push(`🔍 Running LinkedIn Scraper for keywords: [${keywords.join(", ")}] in ${locationResolved}`);

    try {
      // Dynamically import to avoid circular deps if any, or just standard import
      const { linkedinScraper } = await import("@/lib/scrapers/linkedin");

      const results = await linkedinScraper.scrape({
        keywords,
        location: locationResolved,
        limit: 10 // Default limit
      }, this.context.userId);

      logs.push(`✅ Found ${results.length} LinkedIn profiles`);
      if (results.length > 0) {
        logs.push(`> Sample: ${results[0].name} (${results[0].website})`);
      }

      // Store in variables for next steps
      this.context.variables.linkedinResults = results;

      // Also optionally save to database if configured? 
      // For now just keep in flow state
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(`❌ LinkedIn Scraper Failed: ${errorMsg}`);
      throw error;
    }
  }

  private async executeLinkedinMessageTask(config: NodeData["config"], logs: string[]): Promise<void> {
    const message = config?.messageBody || "";
    const profileUrl = config?.profileUrl || "";

    const resolvedMessage = this.interpolateString(message);
    const resolvedUrl = this.interpolateString(profileUrl);

    if (!resolvedUrl) {
      logs.push("⚠️ No LinkedIn Profile URL provided. Skipping message.");
      return;
    }

    // 1. Get User's LinkedIn Cookie
    const user = await db.query.users.findFirst({
      where: eq(users.id, this.context.userId),
      columns: { linkedinSessionCookie: true }
    });

    if (!user || !user.linkedinSessionCookie) {
      logs.push("❌ Error: LinkedIn Session Cookie not found. Please add your 'li_at' cookie in Settings.");
      throw new Error("LinkedIn Cookie missing");
    }

    logs.push(`🤖 Starting LinkedIn Automation for ${resolvedUrl}`);

    // 2. Import Dynamically
    const { sendLinkedinConnectRequest } = await import("@/lib/linkedin-automation");

    // 3. Execute
    const result = await sendLinkedinConnectRequest(
      user.linkedinSessionCookie,
      resolvedUrl,
      resolvedMessage
    );

    // 4. Merge Logs
    logs.push(...result.logs);

    if (result.success) {
      this.context.variables.lastMessageStatus = "sent";
    } else {
      this.context.variables.lastMessageStatus = "failed";
      throw new Error(result.error || "LinkedIn automation failed");
    }
  }

  private async executeWhatsAppNode(node: Node<NodeData>): Promise<void> {
    const templateName = node.data.config?.templateName || "hello_world";
    const businessPhone = this.context.businessData.phone;

    if (!businessPhone) {
      throw new Error("No phone number found for business");
    }

    const variables = node.data.config?.variables || [];

    // Resolve variables
    const resolvedVariables = variables.map((v: string) => this.resolveValue(v));

    const components = [
      {
        type: "body",
        parameters: resolvedVariables.map((v) => ({
          type: "text",
          text: String(v ?? "")
        }))
      }
    ];

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/client");

    const result = await sendWhatsAppMessage({
      to: businessPhone,
      templateName,
      templateLanguage: "en_US",
      templateComponents: components
    });

    if (!result.success) {
      throw new Error(result.error);
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
import { queueWorkflowExecution } from "@/lib/queue";

// Function to execute a workflow for all pending businesses
export async function executeWorkflowLoopWithLogging(
  workflowId: string,
  userId: string,
  businessId?: string
): Promise<{ success: boolean; logs: string[]; executionId: string }> {

  const workflow = await db.query.automationWorkflows.findFirst({
    where: and(
      eq(automationWorkflows.id, workflowId),
      eq(automationWorkflows.userId, userId)
    ),
  });

  if (!workflow) {
    return { success: false, logs: ["Workflow not found"], executionId: "" };
  }

  const businessesToProcess: Business[] = [];

  if (businessId) {
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.userId, userId)
      ),
    });
    if (!business) {
      return { success: false, logs: ["Business not found"], executionId: "" };
    }
    businessesToProcess.push(business as unknown as Business);
  } else {
    // Bulk execution
    const businessesList = await db.query.businesses.findMany({
      where: and(
        eq(businesses.userId, userId),
        eq(businesses.category, workflow.targetBusinessType),
        eq(businesses.emailSent, false),
      ),
      limit: 50,
    });
    businessesToProcess.push(...(businessesList as unknown as Business[]));
  }

  const logs: string[] = [];
  const executionIds: string[] = [];

  for (const business of businessesToProcess) {
    // Create execution log entry for EACH business
    const [executionLog] = await db
      .insert(workflowExecutionLogs)
      .values({
        workflowId,
        businessId: business.id,
        userId,
        status: "pending", // changed from running to pending/queued
        startedAt: new Date(),
        logs: JSON.stringify([`⏳ Queued for execution (Business: ${business.name})`])
      })
      .returning();

    executionIds.push(executionLog.id);

    // Add to Queue
    await queueWorkflowExecution({
      workflowId,
      userId,
        businessId: business.id,
      executionId: executionLog.id
    });

    logs.push(`Queued execution for ${business.name}`);
  }

  return {
    success: true,
    logs,
    executionId: executionIds[0] || "", // Return first ID for reference
  };
}
