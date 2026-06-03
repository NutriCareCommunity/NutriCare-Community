import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing! Gemini function calls will fail.");
}

export function getAi(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required to execute AI tasks.");
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Single singleton instance (lazy proxy so we don't crash at module load time but crash when used)
export const ai = new Proxy({} as GoogleGenAI, {
  get(target, prop, receiver) {
    const client = getAi();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
