import { Router, Response, NextFunction } from "express";
import { ai, GEMINI_MODEL } from "../gemini";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";
import { checkRateLimit } from "../rate-limit";
import { Type } from "@google/genai";
import { 
  chatRequestSchema, 
  mealPlanRequestSchema, 
  analyzeImageSchema,
  SUPPORTED_LANGUAGES,
  AGE_GROUPS
} from "../validators";
import { adminDb, admin } from "../firebase-admin";

const router = Router();

// Rate limiter helper middleware for Gemini API routes
async function rateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user?.uid;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Authentication required for rate determination" });
  }

  try {
    const { allowed } = await checkRateLimit(userId, 15, 60000); // 15 requests/min limit for AI endpoints
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: "Rate Limit Exceeded: You've made too many requests. Max 15 inquiries per minute on Gemini. Please wait."
      });
    }
    next();
  } catch (err) {
    console.error("Rate limit check failed, preceding gracefully:", err);
    next();
  }
}

/**
 * 1. POST /api/gemini/chat - Contextual chat with habit detection with structured JSON response
 */
router.post("/gemini/chat", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    // We check the user query and validate simple fields
    const queryStr = rawBody.query || "";
    const language = rawBody.language || "en";
    const context = rawBody.context || {};
    const { appMode = "standard", profileName = "User" } = context;

    if (!queryStr) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const systemInstruction = `
You are the "Caring Companion" for NutriCare Community.
Personality: Warm, knowledgeable, like a caring elder sister or auntie.
- NEVER shame users. Junk food → "It's okay sometimes! Let's add sprouts next time ❤️"
- child mode: Use "Superpowers" from food, many emojis (🦁🍎⚡)
- elderly mode: Calm, focus on digestion, bone health, easy-to-chew foods
- Always respond in: ${language}
Detect habit logs (water, meals, junk) and include structured action in response.
Return ONLY valid JSON:
{ 
  "text": "Warm, encouraging message in specified language", 
  "action": { "type": "log_habit", "habitType": "water" | "meal" | "junk", "value": number, "description": "Short log description" } | null, 
  "simpleExplanation": "One very simple sentence for low-literacy users in specified language" 
}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: queryStr }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json(parsedJson);

  } catch (err: any) {
    console.error("Error in /api/gemini/chat:", err);
    return res.json({
      text: "I'm here for you, but I'm having a little trouble connecting. Let's try again in a moment! ❤️",
      action: null,
      simpleExplanation: "Please try again, I'm having a small problem."
    });
  }
});

/**
 * 2. POST /api/gemini/meal-plan - Generate a 1-day Indian meal plan
 */
router.post("/gemini/meal-plan", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = mealPlanRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { language, budget, healthGoal, appMode } = validation.data;

    const prompt = `
Generate a 1-day Indian meal plan.
Budget: ₹${budget}
Health goal: ${healthGoal}
Mode: ${appMode}
Language: ${language}

Use seasonal, locally available Indian ingredients (such as dal, roti, sabzi, millets, eggs, ragi, moringa).
If 'child' mode: make it fun, talk about superpowers.
If 'elderly' mode: soft, easy to digest, bone-friendly.

Return ONLY this JSON schema:
{
  "breakfast": "description + approx calories",
  "lunch": "description + approx calories",
  "dinner": "description + approx calories",
  "snacks": "description + approx calories",
  "caringTip": "One warm tip about why this plan is healthy"
}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (err: any) {
    console.error("Error generating meal plan:", err);
    return res.status(500).json({ success: false, error: "Failed to generate meal plan. Please try again later." });
  }
});

/**
 * 3. POST /api/gemini/analyze-food - Multimodal food photo analysis
 */
router.post("/gemini/analyze-food", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = analyzeImageSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { base64Image } = validation.data;

    // Remove potential base64 prefix
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this Indian food image.
Provide: food name, estimated calories, protein (g), sugar (g), healthScore (1-10),
main ingredients (array of strings), healthier alternatives for rural Indian context (array of strings),
and whether common ingredients are available in rural India (boolean).
Return ONLY valid JSON with this exact structure:
{
  "name": "string (food name)",
  "calories": number,
  "protein": number,
  "sugar": number,
  "healthScore": number,
  "ingredients": ["string"],
  "alternatives": ["string"],
  "isRuralFriendly": boolean
}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
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

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (err: any) {
    console.error("Error analyzing food photo:", err);
    return res.status(500).json({ success: false, error: "Failed to analyze food photograph. Please ensure it is a clear food image." });
  }
});

/**
 * 4. POST /api/gemini/simplify - Simplify complex health advice for low-literacy users
 */
router.post("/gemini/simplify", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { textToSimplify, language = "en" } = req.body;

    if (!textToSimplify) {
      return res.status(400).json({ success: false, error: "textToSimplify is required" });
    }

    const prompt = `
Rewrite this health advice in ONE very simple sentence.
Use easy words. Add 1-2 emojis. Make it suitable for someone with low literacy.
Language: ${language}
Text to simplify: ${textToSimplify}
Return only the simplified sentence, nothing else.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    const text = response.text?.trim() || "Eat healthy for more energy! 🥗";
    return res.json({ text });

  } catch (err: any) {
    console.error("Error simplifying advice:", err);
    return res.json({ text: "Eat healthy for more energy! 🥗" });
  }
});

/**
 * 5. POST /api/gemini/health-advisor - Pull recent habits and generate personalized advice
 */
router.post("/gemini/health-advisor", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { history, language = "en" } = req.body;

    const historyData = history ? JSON.stringify(history) : "No recent logs recorded.";

    const prompt = `
Based on this user's recent nutrition habit logs: ${historyData}
Give a short, warm, encouraging health tip in ${language}.
Focus on Indian rural food availability (millet, pulses, seasonal greens, drumstick leaves, ragi).
Keep it under 3 sentences. No medical diagnosis. Use warm, caring tone.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    const text = response.text?.trim() || "Eat fresh greens and drink water! ❤️";
    return res.json({ text });

  } catch (err: any) {
    console.error("Error in health advisor tip:", err);
    return res.status(500).json({ success: false, error: "Failed to generate health advice tip." });
  }
});

/**
 * 6. POST /api/gemini/voice-log - Fully automated Web Speech parser for rural meals and health symptoms
 */
router.post("/gemini/voice-log", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { speechText, language = "en" } = req.body;
    const userId = req.user?.uid;

    if (!speechText || !speechText.trim()) {
      return res.status(400).json({ success: false, error: "Spoken script or voice text is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "User authentication required" });
    }

    const systemInstruction = `
You are an expert AI clinical nutritionist and rural community health helper for India.
Identify if the user is logging a daily MEAL (foods they ate, water they drank, etc.) OR reporting a HEALTH SYMPTOM/illness.
Translate any regional Indian descriptions (ragi, idli, jowar, dhal, drumstick leaves, etc.) if spoken in Hindi, Telugu, or mixed languages.

Return ONLY a valid JSON object matching this exact schema structural template:
{
  "category": "meal" | "symptom" | "unclear",
  "parsedText": "Cleaned up transcription or standard english summary of the user's log",
  "mealDetails": {
    "foodName": "Descriptive English name of food",
    "calories": number (estimate based on spoken portion, default 250),
    "protein": number (estimated grams),
    "iron": number (estimated milligrams),
    "nutritionSummary": "Short nutritional profile of what they had"
  } | null,
  "symptomDetails": {
    "detectedSymptoms": ["list of symptoms e.g. headache, dehydration, muscle cramps, dizziness"],
    "severity": "low" | "medium" | "high",
    "carativeAdvice": "Reassuring, non-prescriptive first aid or comfort instructions using traditional available items (ginger, buttermilk, oral hydration/ORS, coconut water)",
    "regionalAlert": "Alert user to regional seasonal risks (like sunstroke in summer or dengue/flu in monsoon) and advise them to consult their Asha Worker immediately if severity is medium or high"
  } | null
}
`;

    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Perform secure parsing on this voice transcription spoken in language: '${language}': "${speechText}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const parsedData = JSON.parse(aiResponse.text || "{}");

    // Persist real-time logs bypass using database admin authorization
    const habitRef = adminDb.collection("users").doc(userId).collection("habits").doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (parsedData.category === "meal" && parsedData.mealDetails) {
      const { foodName, calories, protein, iron, nutritionSummary } = parsedData.mealDetails;
      await habitRef.set({
        type: "meal",
        value: calories || 250,
        description: `Voice Log: ${foodName}. ${nutritionSummary || ""}`,
        ironContent: iron || 0,
        proteinContent: protein || 0,
        timestamp
      });
      
      // Update global user nutriScore slightly based on healthy proteins/iron
      const userRef = adminDb.collection("users").doc(userId);
      const pointsIncrement = 15; // Log by voice reward
      await userRef.update({
        points: admin.firestore.FieldValue.increment(pointsIncrement),
        updatedAt: timestamp
      });
    } else if (parsedData.category === "symptom" && parsedData.symptomDetails) {
      const { detectedSymptoms, severity, carativeAdvice } = parsedData.symptomDetails;
      await habitRef.set({
        type: "symptom",
        value: severity === "high" ? 3 : severity === "medium" ? 2 : 1,
        description: `Voice Symptom: ${detectedSymptoms.join(", ")}. ${carativeAdvice}`,
        timestamp
      });

      // Save a persistent warning insight for Asha/Doctor review alert
      const insightRef = adminDb.collection("users").doc(userId).collection("ai_insights").doc();
      await insightRef.set({
        category: severity === "high" ? "medical_alert" : "tip",
        content: `Alert: Reported symptoms (${detectedSymptoms.join(", ")}) with ${severity} severity. Reassurance: ${carativeAdvice}`,
        isRead: false,
        timestamp
      });
    }

    return res.json({
      success: true,
      category: parsedData.category,
      parsedText: parsedData.parsedText || speechText,
      mealDetails: parsedData.mealDetails,
      symptomDetails: parsedData.symptomDetails
    });

  } catch (err: any) {
    console.error("Critical error in Web Speech parser route:", err);
    return res.status(550).json({ success: false, error: "Internal voice extraction pipeline failed." });
  }
});

export default router;
