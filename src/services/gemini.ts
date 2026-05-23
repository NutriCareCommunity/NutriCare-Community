/**
 * SECURE CLIENT PROXY FOR NUTRICARE COMMUNITY Backend
 * Proxies calls to `/api/gemini/*` endpoints to keep the API key on the server.
 */

export const getNuitritionAdvice = async (query: string, language: string, context?: any) => {
  const result = await processChat(query, language, context);
  return result.text;
};

export const processChat = async (query: string, language: string, context?: any) => {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, language, context }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Client Proxy Error (processChat):", error);
    return {
      text: "I'm here for you, but I'm having a little trouble connecting. Let's try again in a moment! ❤️",
      action: null,
      simpleExplanation: "Please try again, I'm having a small problem."
    };
  }
};

export const getExplainedSimply = async (textToSimplify: string, language: string) => {
  try {
    const response = await fetch("/api/gemini/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textToSimplify, language }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.text || "Eat healthy for more energy! 🥗";
  } catch (err) {
    console.error("Client Proxy Error (getExplainedSimply):", err);
    return "Eat healthy for more energy! 🥗";
  }
};

export const getMealPlan = async (language: string, budget: number, healthGoal: string, appMode: string) => {
  try {
    const response = await fetch("/api/gemini/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, budget, healthGoal, appMode }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Client Proxy Error (getMealPlan):", error);
    return null;
  }
};
