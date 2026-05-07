const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function geminiFetch(model: string, method: string, body: Record<string, unknown>): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

  const url = `${GEMINI_API_URL}/${model}:${method}?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error ${res.status}`);
  }

  return res.json() as Promise<GeminiResponse>;
}

export async function analyzeSentiment(text: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { sentiment: "neutral", confidence: 0 };
  }

  try {
    const prompt = `Analyze the sentiment of the following Instagram message and return ONLY a JSON object with "sentiment" (positive, negative, or neutral) and "confidence" (0-1).
    
    Message: "${text}"`;

    const data = await geminiFetch("gemini-1.5-flash", "generateContent", {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
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
    const contextHistory = params.context 
      ? JSON.parse(params.context) as { history: Array<{ role: string; content: string }> } 
      : { history: [] };
    const history = contextHistory.history || [];

    const chatHistory = history.map((h: { role: string; content: string }) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    }));

    const systemPrompt = params.prompt || "You are a helpful assistant. Reply professionally and friendly.";
    const userPrompt = `User message: "${params.userMessage}"

Generate a reply based on the user's message. Be concise (max 2 sentences), friendly, and professional.`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    let data;
    if (chatHistory.length > 0) {
      // Manual chat sequence
      const contents = [...chatHistory, { role: "user", parts: [{ text: userPrompt }] }];
      data = await geminiFetch("gemini-1.5-flash", "generateContent", {
        contents,
        generationConfig: { maxOutputTokens: 150 },
      });
    } else {
      data = await geminiFetch("gemini-1.5-flash", "generateContent", {
        contents: [{ parts: [{ text: fullPrompt }] }],
      });
    }

    const reply = data.candidates[0].content.parts[0].text.trim();

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
    const prompt = `Classify the intent of this message into one of: inquiry, pricing, support, complaint, collaboration, spam, or other. Return ONLY the single word.

Message: "${text}"`;

    const data = await geminiFetch("gemini-1.5-flash", "generateContent", {
      contents: [{ parts: [{ text: prompt }] }],
    });

    return data.candidates[0].content.parts[0].text.toLowerCase().trim().replace(/[^a-z]/g, "");
  } catch (error) {
    console.error("[AI] Intent detection failed:", error);
    return "unknown";
  }
}

export async function categorizeLead(text: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "unknown";

  try {
    const prompt = `Categorize this potential lead based on their message. Return ONLY one of these tags: "interested", "support", "complaint", "partnership", "spam", or "other".
    
    Message: "${text}"`;

    const data = await geminiFetch("gemini-1.5-flash", "generateContent", {
      contents: [{ parts: [{ text: prompt }] }],
    });

    return data.candidates[0].content.parts[0].text.toLowerCase().trim().replace(/[^a-z]/g, "");
  } catch (error) {
    console.error("[AI] Lead categorization failed:", error);
    return "other";
  }
}
