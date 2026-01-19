import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No GEMINI_API_KEY found in environment");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    console.log(genAI)
    // The SDK doesn't have a direct listModels method on the client instance in some versions,
    // but deeper access might needed. 
    // Actually, checking documentation or just trying a known "trick" or just testing models.
    
    // Using a REST call might be easier to be sure without SDK version ambiguity.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: { supportedGenerationMethods: string | string[]; name: unknown; }) => {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("No models found or error structure:", data);
    }

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
