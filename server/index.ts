// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";

dotenv.config();
process.env.HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Stripe webhook (raw body)
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// JSON header for all API routes
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Debug logging for API routes
app.use("/api", (req, res, next) => {
  console.log(`🔍 API REQUEST: ${req.method} ${req.url}`);
  next();
});

// 管理系ルート登録
const { registerAdminRoutes } = await import("./admin-routes.js");
registerAdminRoutes(app);

// Claude API endpoints
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKey: !!process.env.ANTHROPIC_API_KEY,
  });
});

app.post("/api/problem", async (req, res, next) => {
  console.log("🔥 Claude Problem API hit", req.body);
  try {
    const { handleProblemGeneration } = await import("./routes.js");
    await handleProblemGeneration(req, res, next);
  } catch (error) {
    console.error("Claude problem generation error:", error);
    res.status(500).json({ error: "Problem generation failed" });
  }
});

app.post("/api/evaluate-with-claude", async (req, res, next) => {
  console.log("🔥 Claude Evaluation API hit", req.body);
  try {
    const { handleClaudeEvaluation } = await import("./routes.js");
    await handleClaudeEvaluation(req, res, next);
  } catch (error) {
    console.error("Claude evaluation error:", error);
    res.status(500).json({ error: "Evaluation failed" });
  }
});

// フロントのルートなど
const { registerMainRoutes } = await import("./routes.js");
registerMainRoutes(app);

// Viteミドルウェア（必ず最後に）
if (process.env.NODE_ENV !== "production") {
  const { setupVite } = await import("./vite.js");
  await setupVite(app, null);
}

// サーバー起動
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
