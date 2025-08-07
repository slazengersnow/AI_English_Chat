import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
// Remove broken setupVite import - using working pattern

dotenv.config();

// ✅ Override host settings for Replit compatibility
process.env.HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS
app.use(cors());

// Stripe webhook
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// JSON parsing
app.use(express.json());

// ヘルスチェック（APIより前に配置）
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Set response headers for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Register admin routes
const { registerAdminRoutes } = await import('./admin-routes.js');
registerAdminRoutes(app);

// API routes MUST be registered BEFORE Vite middleware

// Debug middleware for API routes only
app.use('/api', (req, res, next) => {
  console.log(`🔍 API REQUEST: ${req.method} ${req.url}`);
  next();
});

// Direct API routes (no router overhead)
app.get("/api/ping", (req, res) => {
  console.log("🔥 Direct ping route SUCCESS!");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem route SUCCESS!", req.body);
  
  // Import and use the actual handler
  try {
    const { handleProblemGeneration } = await import('./routes.js');
    await handleProblemGeneration(req, res);
  } catch (error) {
    console.error("Problem generation error:", error);
    res.status(500).json({ error: "Problem generation failed" });
  }
});

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation route SUCCESS!", req.body);
  
  // Import and use the actual handler  
  try {
    const { handleClaudeEvaluation } = await import('./routes.js');
    await handleClaudeEvaluation(req, res);
  } catch (error) {
    console.error("Claude evaluation error:", error);
    res.status(500).json({ error: "Evaluation failed" });
  }
});

// CRITICAL: Test if API routes work before Vite setup
app.get("/api/test-before-vite", (req, res) => {
  console.log("🔥 API TEST - Before Vite setup");
  res.json({ 
    message: "API working before Vite", 
    timestamp: new Date().toISOString()
  });
});

// Register all main routes directly to app FIRST
const { registerMainRoutes } = await import('./routes.js');
registerMainRoutes(app);

// Health check route
app.get("/api/status", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    routes: "loaded via direct registration",
    apiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// CRITICAL: Add explicit API routes BEFORE Vite
console.log("🔧 Setting up API routes BEFORE Vite...");

// Apply existing Vite integration that works correctly with API routes
if (process.env.NODE_ENV !== "production") {
  const { setupVite } = await import("./vite.js");
  await setupVite(app, null);
}

// Final API test after Vite
app.get("/api/test-after-vite", (req, res) => {
  console.log("🔥 API TEST - After Vite setup");
  res.json({ 
    message: "API working after Vite", 
    timestamp: new Date().toISOString()
  });
});

// サーバー起動
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});