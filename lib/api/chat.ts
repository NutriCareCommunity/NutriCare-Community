import { Router, Response } from "express";
import { z } from "zod";
import { ai } from "../gemini";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Zod Validation Schema
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "ai", "model", "assistant"]),
      content: z.string().min(1).max(5000),
    })
  ).min(1),
});

// Simple In-Memory Rate Limiting: max 20 requests/min per user
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(req: AuthenticatedRequest, res: Response, next: any) {
  const userId = req.user?.uid;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Authentication required for rate determination" });
  }

  const now = Date.now();
  const limitWindowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const record = rateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    // Initialize or reset limit
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + limitWindowMs,
    });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Rate Limit Exceeded: You've made too many requests. Max 20 inquiries per minute on AI Chat. Please pause."
    });
  }

  record.count += 1;
  next();
}

/**
 * POST /api/chat - Stream conversation with NutriBot
 */
router.post("/chat", authMiddleware, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = chatRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { messages } = validation.data;

    // Map conversation elements to `@google/genai` type definitions
    const formattedContents = messages.map(msg => ({
      role: msg.role === "ai" || msg.role === "assistant" || msg.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }],
    }));

    // Configure response stream headers for Server-Sent Events / raw streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish baseline stream output immediately

    const systemInstruction = 
      "You are NutriBot, a friendly nutrition assistant for NutriCare Community. " +
      "Give practical, evidence-based advice on nutrition, healthy eating, and wellness. " +
      "Always recommend consulting a health professional for medical issues.";

    // Invoke Gemini Streaming Content Generation
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      // Return chunks wrapped inside a clean SSE data container
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Gemini AI Streaming Chat Error:", err);
    // Secure error propagation: never leak raw firebase/google auth stack traces to clients
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "The NutriBot system is temporarily overloaded. Please try again soon."
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream unexpectedly interrupted." })}\n\n`);
      res.end();
    }
  }
});

export default router;
