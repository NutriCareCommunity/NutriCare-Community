import express from "express";
import usersRouter from "../lib/api/users";
import nutritionRouter from "../lib/api/nutrition";
import communityRouter from "../lib/api/community";
import chatRouter from "../lib/api/chat";
import geminiRouter from "../lib/api/gemini";
import portalRouter from "../lib/api/portal";
import adminRouter from "../lib/api/admin";
import familiesRouter from "../lib/api/families";
import devicesRouter from "../lib/api/devices";
import growthRouter from "../lib/api/growth";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/api/health", (req, res) => res.json({ status: "operational", env: "vercel", timestamp: new Date().toISOString() }));

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

export default app;
