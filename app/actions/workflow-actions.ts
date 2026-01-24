"use server";

import { generateWorkflowFromPrompt } from "@/lib/gemini";
import { Node, Edge } from "reactflow";

// Define return type
interface GenerateWorkflowResponse {
    success: boolean;
    data?: {
        nodes: Node[];
        edges: Edge[];
    };
    error?: string;
}

export async function generateWorkflowAction(prompt: string): Promise<GenerateWorkflowResponse> {
    if (!prompt) {
        return { success: false, error: "Prompt is required" };
    }

    try {
        const workflowData = await generateWorkflowFromPrompt(prompt);

        // Ensure nodes and edges are present and valid (basic check)
        if (!Array.isArray(workflowData.nodes) || !Array.isArray(workflowData.edges)) {
            return { success: false, error: "AI generated invalid workflow structure" };
        }

        return { success: true, data: workflowData };
    } catch (error: unknown) {
        let errorMessage = "Failed to generate workflow";

        if (error instanceof Error) {
            // Log clean error for rate limits
            if (error.message.includes("429") || error.message.includes("Quota exceeded")) {
                console.warn("AI Workflow Action Rate Limit:", error.message);
                errorMessage = "AI usage limit exceeded. Please try again later.";
            } else {
                console.error("AI Workflow Action Error:", error);
                errorMessage = error.message;
            }
        } else {
            console.error("AI Workflow Action Unknown Error:", error);
        }

        return { success: false, error: errorMessage };
    }
}
