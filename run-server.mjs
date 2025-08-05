#!/usr/bin/env node

// Complete Express+Vite server for Replit port 5000
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 5000;

// CORS and JSON parsing
app.use(cors());
app.use(express.json());

console.log("🚀 Express server starting on port", PORT);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// API routes BEFORE Vite middleware (CRITICAL ORDER)
app.post("/api/problem", (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  res.json({
    japaneseSentence: "チームメンバーと連携を取ってください。",
    hints: ["問題1"],
    dailyLimitReached: false,
    currentCount: 1,
    dailyLimit: 100
  });
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

app.get("/api/ping", (req, res) => {
  console.log("🔥 Ping endpoint hit");
  res.send("pong");
});

// Vite integration for development
if (process.env.NODE_ENV !== "production") {
  try {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    console.log("🚀 Vite development server configured");
  } catch (error) {
    console.error("❌ Vite setup failed:", error);
  }
}

// Start server on all interfaces (0.0.0.0) for Replit
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 External access: https://your-repl-name.replit.dev/`);
});