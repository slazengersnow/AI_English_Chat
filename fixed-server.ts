// Fixed server with proper Claude API integration
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "vite";
import path from "path";

// Import the working route handlers
import { handleProblemGeneration, handleClaudeEvaluation } from './server/routes.js';
import { registerAdminRoutes } from './server/admin-routes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

console.log("🔥 Starting fixed server with working Claude API...");

// CRITICAL: API routes BEFORE Vite middleware
app.get("/api/ping", (req, res) => {
  console.log("🔥 Ping endpoint working!");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  await handleProblemGeneration(req, res);
});

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation endpoint hit:", req.body);
  await handleClaudeEvaluation(req, res);
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// Register admin routes
registerAdminRoutes(app);

// Vite setup with proper API exclusion
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Setting up Vite with API protection...");
    
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      root: path.resolve("client"),
    });

    app.use(vite.middlewares);

    // SPA fallback that properly excludes API routes
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes - let Express handle them first
      if (url.startsWith("/api/")) {
        console.log(`🚫 API route ${url} not found`);
        return res.status(404).json({ error: "API endpoint not found" });
      }

      try {
        const template = await vite.transformIndexHtml(url, `
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
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Fixed server running on port ${PORT}`);
    console.log("🔥 API endpoints available:");
    console.log("   GET  /api/ping");
    console.log("   POST /api/problem");
    console.log("   POST /api/evaluate-with-claude");
    console.log("   GET  /api/status");
  });
}

setupServer().catch(console.error);