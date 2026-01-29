
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Node, Edge } from "reactflow";
import { auth } from "@/auth"; // Validate path is correct or adjust
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getEffectiveApiKey(providedKey?: string): Promise<string | undefined> {
  if (providedKey) return providedKey;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { geminiApiKey: true }
      });
      if (user?.geminiApiKey) return user.geminiApiKey;
    }
  } catch (error) {
    console.warn("Failed to fetch Gemini API key from DB:", error);
  }
  return undefined;
}

export async function generateEmailTemplate(
  businessType: string,
  purpose: string,
  apiKey?: string
): Promise<{ subject: string; body: string }> {
  try {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key provided");

    const client = new GoogleGenerativeAI(key);

    // Models to try in order of preference
    const models = ["gemini-3-flash-preview", "gemini-2.0-flash"]; /* "gemini-2.0-flash-exp" is also common, but sticking to user request */
    let lastError;

    for (const modelName of models) {
      try {
        const model = client.getGenerativeModel({ model: modelName });

        const prompt = `Generate a professional cold email template for reaching out to ${businessType} businesses.
        
Purpose: ${purpose}

Requirements:
- Use variables like {brand_name}, {website}, {email}, {phone}, {address}, {category} for personalization
- Keep it concise and professional
- Include a clear call-to-action
- Use HTML formatting for better readability
- Make it compelling and not too sales-y

Return ONLY a JSON object with "subject" and "body" fields. No markdown, no code blocks, just the JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Failed to parse JSON from response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject,
          body: parsed.body,
        };
      } catch (error) {
        console.warn(`Gemini generation failed with model ${modelName}:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    // If all models fail, throw the last error
    throw lastError || new Error("Failed to generate content with all available Gemini models");
  } catch (error) {
    console.error("Error generating template:", error);
    throw error;
  }
}

export async function evaluateCondition(
  condition: string,
  business: Record<string, unknown>
): Promise<boolean> {
  try {
    // Simple condition evaluation
    // Example: "!website" means no website
    if (condition.startsWith("!")) {
      const field = condition.slice(1);
      return !business[field] || business[field] === "";
    }

    // Example: "website" means has website
    return !!business[condition];
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}

/**
 * Generate AI content using Gemini
 */
export async function generateAIContent(prompt: string, apiKey?: string): Promise<string> {
  try {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(key);
    const models = ["gemini-3-flash-preview", "gemini-2.0-flash"];
    let lastError;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
      } catch (error) {
        console.warn(`Gemini generation failed with model ${modelName}:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    // If all models fail, throw the last error
    throw lastError || new Error("Failed to generate content with all available Gemini models");
  } catch (error) {
    console.error("Error generating AI content:", error);
    throw error;
  }
}

/**
 * Generate a workflow JSON from a natural language prompt
 */

export async function generateWorkflowFromPrompt(
  prompt: string,
  apiKey?: string
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  try {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(key);
    // Models to try in order
    const models = ["gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemPrompt = `
              You are an expert automation architect. Your task is to generate a JSON object representing a workflow for a node-based automation editor (ReactFlow).
        
              Available Node Types:
              - start: Entry point (always required)
              - condition: Evaluates a condition (true/false paths)
              - template: Sends an email template
              - delay: Waits for a specified duration
              - custom: Executes custom code
              - gemini: AI processing task
              - apiRequest: Makes an HTTP request
              - agent: AI Agent with Excel capabilities
              - webhook: Listens for external events
              - schedule: Triggers on a schedule (cron)
              - merge: Merges multiple paths
              - splitInBatches: Loops through items
              - filter: Filters data
              - set: Sets variables
              - scraper: Scrapes a website
        
              Schema Requirement:
              Return a JSON object with two arrays: "nodes" and "edges".
              
              Node Structure:
              {
                "id": "string (unique, e.g., 'start-1', 'email-2')",
                "type": "string (one of the available types)",
                "data": { 
                  "label": "string (descriptive name)",
                  "type": "string (must match the outer type)",
                  "config": {} (optional configuration based on node type)
                },
                "position": { "x": number, "y": number }
              }
        
              Edge Structure:
              {
                "id": "string (unique, e.g., 'e1-2')",
                "source": "string (source node id)",
                "target": "string (target node id)",
                "label": "string (optional, e.g., 'True' for condition)"
              }
        
              Layout Rules:
              - Arrange nodes logically.
              - Use a vertical flow (y increases downwards).
              - Center the 'start' node at x: 250, y: 0.
              - Space nodes sufficiently (e.g., y + 150 for each step).
              - For conditions, branch out left and right.
        
              User Prompt: "${prompt}"
        
              Response Format:
              ONLY return the raw JSON object. Do not include markdown formatting (like \`\`\`json).
            `;

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        let text = response.text();

        // Clean up potential markdown formatting
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
          const workflowData = JSON.parse(text);
          if (!workflowData.nodes || !workflowData.edges) {
            throw new Error("Invalid workflow format generated");
          }
          return workflowData;
        } catch {
          console.warn(`Failed to parse workflow from ${modelName}:`, text);
          // If specific parsing fails, maybe try another model? 
          // Or just re-throw to be caught by the outer loop?
          throw new Error("Failed to parse generated workflow");
        }

      } catch (error) {   
        console.warn(`Gemini workflow generation failed with model ${modelName}:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    // If all models fail
    throw lastError || new Error("Failed to generate workflow with all available Gemini models");

  } catch (error) {
    console.error("Error generating workflow from prompt:", error);
    throw error;
  }
}
