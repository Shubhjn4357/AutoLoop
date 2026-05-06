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

export async function generateSmartReply(history: { role: "user" | "model"; content: string }[]) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const lastMessage = history[history.length - 1].content;
    const prompt = `Suggest a professional and friendly reply to this message: "${lastMessage}". Keep it short and suitable for Instagram DMs.`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("[AI] Smart reply generation failed:", error);
    return null;
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
