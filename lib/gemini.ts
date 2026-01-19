import { GoogleGenerativeAI } from "@google/generative-ai";

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
