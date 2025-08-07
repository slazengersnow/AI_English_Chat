// Express server with Vite integration for Replit
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = 5000;

app.use(express.json());

// Dynamic imports to avoid issues
async function setupRoutes() {
  const { handleProblemGeneration, handleClaudeEvaluation } = await import('./server/routes.js');
  const { registerAdminRoutes } = await import('./server/admin-routes.js');
  
  return { handleProblemGeneration, handleClaudeEvaluation, registerAdminRoutes };
}

// API endpoints BEFORE Vite middleware
app.get("/api/ping", (req, res) => {
  console.log("🔥 Ping endpoint hit");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

// API routes will be setup after dynamic imports
async function setupApiRoutes() {
  const { handleProblemGeneration, handleClaudeEvaluation, registerAdminRoutes } = await setupRoutes();
  
  app.post("/api/problem", async (req, res) => {
    console.log("🔥 Problem endpoint hit:", req.body);
    await handleProblemGeneration(req, res);
  });

  app.post("/api/evaluate-with-claude", async (req, res) => {
    console.log("🔥 Claude evaluation endpoint hit:", req.body);
    await handleClaudeEvaluation(req, res);
  });

  app.post("/api/evaluate", (req, res) => {
    console.log("🔥 Evaluate endpoint hit:", req.body);
    res.json({
      rating: 4,
      modelAnswer: "Please coordinate with your team members.",
      feedback: "良い回答です。文法的に正確で、意味も適切に伝わります。",
      similarPhrases: [
        "Please work closely with your team members.",
        "Please collaborate with your teammates.",
        "Please cooperate with your team."
      ]
    });
  });

  // Register admin routes
  registerAdminRoutes(app);
  
  console.log("🔥 API routes registered successfully");
}

// Vite integration
async function startServer() {
  // Setup API routes first
  await setupApiRoutes();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: path.resolve("client"),
  });

  app.use(vite.middlewares);

  // Fallback for SPA
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes
    if (url.startsWith("/api/")) {
      return next();
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🎯 External access: https://*.replit.dev`);
  });
}

startServer().catch(console.error);