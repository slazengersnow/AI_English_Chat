import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import { registerRoutes } from "./routes.js"; // ← ここが最重要（Claude API用）
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
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});
// 管理系ルート登録
const { registerAdminRoutes } = await import("./admin-routes.js");
registerAdminRoutes(app);
// ✅ Claude API endpoints（手動ルート）
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
    }
    catch (error) {
        console.error("Claude problem generation error:", error);
        res.status(500).json({ error: "Problem generation failed" });
    }
});
app.post("/api/evaluate-with-claude", async (req, res, next) => {
    console.log("🔥 Claude Evaluation API hit", req.body);
    try {
        const { handleClaudeEvaluation } = await import("./routes.js");
        await handleClaudeEvaluation(req, res, next);
    }
    catch (error) {
        console.error("Claude evaluation error:", error);
        res.status(500).json({ error: "Evaluation failed" });
    }
});
// ✅ Claude API含む全APIルートをまとめて登録（最重要！）
registerRoutes(app); // ← これがないと他の /api/* が全部 404
// ✅ API共通ミドルウェア（Claude API後に適用）
app.use("/api", (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
});
app.use("/api", (req, res, next) => {
    console.log(`🔍 API REQUEST: ${req.method} ${req.url}`);
    next();
});
// フロントエンドルートの登録
const { registerMainRoutes } = await import("./routes.js");
registerMainRoutes(app);
// Vite ミドルウェア（必ず最後に）
if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, null);
}
// サーバー起動
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
