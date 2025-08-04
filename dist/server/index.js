// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
// ✅ __dirname の代替（ESM形式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ✅ 環境変数読み込み
dotenv.config();
console.log("Debug - Server Supabase URL:", process.env.VITE_SUPABASE_URL);
console.log("Debug - Supabase Anon Key:", process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...");
const app = express();
const port = Number(process.env.PORT) || 5000;
// ✅ CORS設定
app.use(cors());
// ✅ Stripe webhook（生のボディが必要）
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// ✅ JSONパーシング
app.use(express.json());
// ✅ ヘルスチェック
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: port
    });
});
// ✅ API routes
registerRoutes(app);
// ✅ Vite開発サーバー設定（開発環境のみ）
if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, null);
    console.log("🚀 Vite development server configured");
}
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
