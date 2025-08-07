import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import { setupVite } from "./vite.js";

dotenv.config();

// ✅ Override host settings for Replit compatibility
process.env.HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

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
  const { handleProblemGeneration } = await import('./routes.js');
  await handleProblemGeneration(req, res);
});

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation route SUCCESS!", req.body);
  
  // Import and use the actual handler  
  const { handleClaudeEvaluation } = await import('./routes.js');
  await handleClaudeEvaluation(req, res);
});

// Register all main routes directly to app
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

// CRITICAL: API routes working test
app.get("/api/test-working", (req, res) => {
  console.log("🔥 TEST ROUTE - API is working!");
  res.json({ 
    message: "API routes are working", 
    timestamp: new Date().toISOString(),
    routes: "before-vite"
  });
});

// API route protection middleware - CRITICAL for preventing Vite interference
app.use("/api/*", (req, res, next) => {
  console.log(`🛡️ API route protection: ${req.method} ${req.path}`);
  next();
});

// Use working server pattern with proper Vite integration
if (process.env.NODE_ENV !== "production") {
  console.log("🚀 Setting up working Vite integration...");
  
  const vite = await import("vite");
  const path = await import("path");
  
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: "custom", 
    root: path.resolve("client"),
  });
  
  // Add Vite middleware
  app.use(viteServer.middlewares);
  
  // Custom SPA fallback that EXCLUDES API routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // CRITICAL: Skip API routes completely
    if (url.startsWith("/api/")) {
      console.log(`🚫 Vite fallback skipping API route: ${url}`);
      return res.status(404).json({ error: "API endpoint not found" });
    }
    
    try {
      const template = await viteServer.transformIndexHtml(url, `
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>AI English Chat</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
      `);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      viteServer.ssrFixStacktrace(e);
      next(e);
    }
  });
  
  console.log("🚀 Working Vite setup complete - API routes protected");
}

// サーバー起動
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});