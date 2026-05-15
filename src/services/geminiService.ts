import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  sugar: number;
  healthScore: number;
  ingredients: string[];
  alternatives: string[];
  isRuralFriendly: boolean;
}

export class GeminiAIBackend {
  /**
   * AI Food Detection Pipeline
   * User uploads image -> Analysis -> Logged to Firestore
   */
  static async analyzeIndianFood(base64Image: string, userId: string): Promise<FoodAnalysis> {
    const prompt = `Analyze this Indian food image. Provide: name, calories, protein(g), sugar(g), healthScore(1-10), ingredients, and healthier alternatives suitable for rural Indian context. Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
            healthScore: { type: Type.NUMBER },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            isRuralFriendly: { type: Type.BOOLEAN }
          },
          required: ["name", "calories", "protein", "healthScore"]
        }
      }
    });

    const analysis = JSON.parse(response.text) as FoodAnalysis;

    // Log to secure nutrition_profiles (via users habits for this MVP)
    await addDoc(collection(db, `users/${userId}/habits`), {
      type: "meal",
      value: analysis.calories,
      description: `AI Detected: ${analysis.name}`,
      data: analysis,
      timestamp: serverTimestamp()
    });

    return analysis;
  }

  /**
   * Rural Health Advisor
   * Generates localized recommendations based on recent logs
   */
  static async generateHealthAdvisor(userId: string, language: string = "en"): Promise<string> {
    // 1. Fetch recent activity
    const habitsRef = collection(db, `users/${userId}/habits`);
    const q = query(habitsRef, orderBy("timestamp", "desc"), limit(10));
    const snap = await getDocs(q);
    const history = snap.docs.map(d => d.data());

    // 2. Synthesize Advice
    const prompt = `Based on this user's nutrition history: ${JSON.stringify(history)}. 
    Give a short, encouraging health tip in ${language}. 
    Focus on Indian rural availability (millet, pulses, seasonal greens). 
    Keep it under 3 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    // 3. Store for real-time delivery
    await addDoc(collection(db, `users/${userId}/ai_insights`), {
      category: "nutrition",
      content: response.text,
      isRead: false,
      timestamp: serverTimestamp()
    });

    return response.text;
  }
}
