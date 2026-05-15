import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * CARING COMPANION PERSONA:
 * - Extremely friendly, warm, and supportive (Indian Auntie/Didi vibe).
 * - Never judgmental.
 * - Uses emojis to be visually engaging.
 * - Prioritizes low-literacy friendly explanations.
 */

export const getNuitritionAdvice = async (query: string, language: string, context?: any) => {
  const result = await processChat(query, language, context);
  return result.text;
};

export const processChat = async (query: string, language: string, context?: any) => {
  const { appMode = "standard", profileName = "User" } = context || {};
  
  const systemInstruction = `
    You are the "Caring Companion" for NutriCare Community. 
    Your personality is like a warm, knowledgeable elder sister or auntie who wants everyone in the village to be healthy.
    
    TONE:
    - Human, emotional, and encouraging.
    - Simplified language (Rural-friendly).
    - NEVER shame the user. If they eat junk food, say: "It's okay to enjoy treats sometimes! Let's try adding some sprouts or a fruit next time to balance it out. ❤️"
    
    SPECIAL MODES:
    - If mode is "child": Use playful language, talk about "Superpowers" from food, and use many emojis (🦁, 🍎, ⚡).
    - If mode is "elder": Use respectful, calm language. Focus on digestion, bone health, and easy-to-chew foods. Use larger concepts.
    
    TASK: Respond to ${profileName}'s query in ${language}.
    
    HABIT LOGGING:
    Detect if they want to log habits:
    1. "water": log glasses/liters. (Standard: 1 glass = 250ml).
    2. "meal": logging breakfast/lunch/dinner.
    3. "junk": logging sweets, sodas, fried food.
    
    RESPONSE FORMAT (Strict JSON):
    {
      "text": "Your warm response with emojis.",
      "action": {
        "type": "log_habit",
        "habitType": "water" | "meal" | "junk",
        "value": number,
        "description": "Short log summary"
      } | null,
      "simpleExplanation": "A 1-sentence super simple version for low-literacy users."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I'm here for you, but I'm having a little trouble connecting. Let's try again in a moment! ❤️",
      action: null,
      simpleExplanation: "Please try again, I'm having a small problem."
    };
  }
};

export const getExplainedSimply = async (textToSimplify: string, language: string) => {
    const prompt = `Simplify this health advice into one very easy sentence for someone with low literacy. Use emojis. Language: ${language}. Text: ${textToSimplify}`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });
        return response.text;
    } catch (err) {
        return "Eat healthy for more energy! 🥗";
    }
};

export const getMealPlan = async (language: string, budget: number, healthGoal: string, appMode: string) => {
    const prompt = `
        Generate a 1-day Indian meal plan. 
        Budget: ₹${budget} 
        Goal: ${healthGoal}
        Mode: ${appMode}
        Language: ${language}
        
        Focus on local Indian ingredients (seasonal veg, dal, roti). 
        If 'child' mode: make it fun. 
        If 'elder' mode: make it soft and easy to digest.
        
        Output JSON:
        {
            "breakfast": "...",
            "lunch": "...",
            "dinner": "...",
            "snacks": "...",
            "caringTip": "A warm tip about why this meal is good."
        }
    `;
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Meal Plan Error:", error);
        return null;
    }
};
