import { describe, it, expect, vi } from "vitest";
import { analyzeSentiment, categorizeLead } from "@/lib/ai";

// Mock the GoogleGenerativeAI SDK
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: async (prompt: string) => {
            if (prompt.includes("sentiment")) {
              return {
                response: {
                  text: () => JSON.stringify({ sentiment: "positive", confidence: 0.9 })
                }
              };
            }
            if (prompt.includes("Categorize")) {
              return {
                response: {
                  text: () => "interested"
                }
              };
            }
            return { response: { text: () => "error" } };
          }
        };
      }
    }
  };
});

describe("AI Utilities", () => {
  it("should analyze sentiment correctly", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const result = await analyzeSentiment("I love this app!");
    expect(result.sentiment).toBe("positive");
    expect(result.confidence).toBe(0.9);
  });

  it("should categorize leads correctly", async () => {
    const category = await categorizeLead("How much does this cost?");
    expect(category).toBe("interested");
  });
});
