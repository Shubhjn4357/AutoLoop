import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  }
  return _genAI;
};

export async function analyzeSentiment(text: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { sentiment: "neutral", confidence: 0 };
  }

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the sentiment of the following Instagram message and return ONLY a JSON object with "sentiment" (positive, negative, or neutral) and "confidence" (0-1).
    
    Message: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr) as { sentiment: "positive" | "negative" | "neutral"; confidence: number };
  } catch (error) {
    console.error("[AI] Sentiment analysis failed:", error);
    return { sentiment: "neutral", confidence: 0 };
  }
}

export async function generateSmartReply(params: {
  userMessage: string;
  prompt?: string;
  context?: string;
}): Promise<{ reply: string; intent?: string } | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const contextHistory = params.context ? JSON.parse(params.context) : { history: [] };
    const history = contextHistory.history || [];

    const chatHistory = history.map((h: { role: string; content: string }) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    }));

    const systemPrompt = params.prompt || "You are a helpful assistant. Reply professionally and friendly.";
    const userPrompt = `User message: "${params.userMessage}"

Generate a reply based on the user's message. Be concise (max 2 sentences), friendly, and professional.`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    let result;
    if (chatHistory.length > 0) {
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: { maxOutputTokens: 150 },
      });
      result = await chat.sendMessage(userPrompt);
    } else {
      result = await model.generateContent(fullPrompt);
    }

    const response = await result.response;
    const reply = response.text().trim();

    // Detect intent from the reply
    const intent = await detectIntent(params.userMessage);

    return { reply, intent };
  } catch (error) {
    console.error("[AI] Smart reply generation failed:", error);
    return null;
  }
}

export async function detectIntent(text: string): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "unknown";

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Classify the intent of this message into one of: inquiry, pricing, support, complaint, collaboration, spam, or other. Return ONLY the single word.

Message: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().toLowerCase().trim().replace(/[^a-z]/g, "");
  } catch (error) {
    console.error("[AI] Intent detection failed:", error);
    return "unknown";
  }
}

export async function categorizeLead(text: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "unknown";

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Categorize this potential lead based on their message. Return ONLY one of these tags: "interested", "support", "complaint", "partnership", "spam", or "other".
    
    Message: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().toLowerCase().trim().replace(/[^a-z]/g, "");
  } catch (error) {
    console.error("[AI] Lead categorization failed:", error);
    return "other";
  }
}
