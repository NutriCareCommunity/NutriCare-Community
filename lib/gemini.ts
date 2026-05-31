import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Server-side AI functions will fail if invoked.");
}

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});
