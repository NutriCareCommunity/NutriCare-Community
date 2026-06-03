import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from "firebase/firestore";

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

const getHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export class GeminiAIBackend {
  /**
   * AI Food Detection Pipeline - CLIENT PROXY
   * Proxies AI computation to server side, logs to Firestore on client side
   */
  static async analyzeIndianFood(base64Image: string, userId: string): Promise<FoodAnalysis> {
    try {
      const headers = await getHeaders();
      const response = await fetch("/api/gemini/analyze-food", {
        method: "POST",
        headers,
        body: JSON.stringify({ base64Image }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze image: Backend returned status ${response.status}`);
      }

      const analysis = await response.json() as FoodAnalysis;

      // Log to secure nutrition_profiles
      await addDoc(collection(db, `users/${userId}/habits`), {
        type: "meal",
        value: analysis.calories || 0,
        description: `AI Detected: ${analysis.name}`,
        data: analysis,
        timestamp: serverTimestamp()
      });

      return analysis;
    } catch (error) {
      console.error("Client side analyzeIndianFood Error:", error);
      throw error;
    }
  }

  /**
   * Rural Health Advisor - CLIENT PROXY
   * Pulls local activity logs, proxies synth to server side, stores result to Firestore
   */
  static async generateHealthAdvisor(userId: string, language: string = "en"): Promise<string> {
    try {
      // 1. Fetch recent activity (remains client-side for user credentials/data)
      const habitsRef = collection(db, `users/${userId}/habits`);
      const q = query(habitsRef, orderBy("timestamp", "desc"), limit(10));
      const snap = await getDocs(q);
      const history = snap.docs.map(d => d.data());

      // 2. Request synthesized advice securely from backend
      const headers = await getHeaders();
      const response = await fetch("/api/gemini/health-advisor", {
        method: "POST",
        headers,
        body: JSON.stringify({ history, language }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate health advisor: Backend status ${response.status}`);
      }

      const data = await response.json();
      const adviceText = data.text || "Eat healthy for more energy! 🥗";

      // 3. Store for real-time delivery
      await addDoc(collection(db, `users/${userId}/ai_insights`), {
        category: "nutrition",
        content: adviceText,
        isRead: false,
        timestamp: serverTimestamp()
      });

      return adviceText;
    } catch (err) {
      console.error("generateHealthAdvisor client error:", err);
      return "Make healthy choices and enjoy local nutritious food! ❤️";
    }
  }
}
