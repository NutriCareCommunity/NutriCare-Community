import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Import modular routing systems
import usersRouter from "./lib/api/users";
import nutritionRouter from "./lib/api/nutrition";
import communityRouter from "./lib/api/community";
import chatRouter from "./lib/api/chat";
import geminiRouter from "./lib/api/gemini";   // All /api/gemini/* routes
import portalRouter from "./lib/api/portal";
import adminRouter from "./lib/api/admin";     // All /api/admin/* and bulk survey ingest routes
import familiesRouter from "./lib/api/families";
import devicesRouter from "./lib/api/devices";
import growthRouter from "./lib/api/growth";

dotenv.config();

/**
 * NUTRICARE ENTERPRISE BACKEND
 * Architected for Scale, Government Ingestion, and NGO Analytics.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set expressive JSON size limits for handling image uploads / base64
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Mount modular extended routes
  app.use("/api", usersRouter);
  app.use("/api", nutritionRouter);
  app.use("/api", communityRouter);
  app.use("/api", chatRouter);
  app.use("/api", geminiRouter);
  app.use("/api", portalRouter);
  app.use("/api", adminRouter);
  app.use("/api", familiesRouter);
  app.use("/api", devicesRouter);
  app.use("/api", growthRouter);

  // 1. HEALTH MONITORING
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "operational", 
      version: "2.4.0",
      region: "asia-south1",
      mesh: "enterprise-v2",
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development Vite dev-server routing middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist directory...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Backend powering NutriCare at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical System Failure:", err);
  process.exit(1);
});
