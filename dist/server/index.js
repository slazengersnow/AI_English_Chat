// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
// /api/* を一括登録する関数（routes/index.ts がエクスポート）
import { registerRoutes } from "./routes/index.js";
// Stripe webhook は raw body 必須
import stripeWebhookRouter from "./routes/stripe-webhook.js";
dotenv.config();
process.env.HOST = process.env.HOST || "0.0.0.0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Fly.io は 8080 が標準。PORT 未設定なら 8080
const PORT = Number(process.env.PORT) || 8080;
/* ---------- ミドルウェア順序が重要 ---------- */
// 1) CORS
app.use(cors());
// 2) Stripe Webhook は raw body を json より前に！
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// 3) それ以外の JSON パーサ
app.use(express.json());
/* ---------- ヘルスチェック ---------- */
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});
/* ---------- API共通ログ ---------- */
app.use("/api", (req, _res, next) => {
    console.log(`🔍 API REQUEST: ${req.method} ${req.url}`);
    next();
});
/* ---------- 管理系 ---------- */
const { registerAdminRoutes } = await import("./admin-routes.js");
registerAdminRoutes(app);
/* ---------- /api/* を一括登録（最重要） ---------- */
// Claude用や他のAPIハンドラは routes/index.ts 側に集約
registerRoutes(app);
/* ---------- フロント配信/Vite ミドルウェア ---------- */
if (process.env.NODE_ENV !== "production") {
    // 開発時は Vite ミドルウェア
    const { setupVite } = await import("./vite.js");
    await setupVite(app, null);
}
else {
    // 本番: 環境変数で静的配信をガード
    if (process.env.SERVE_CLIENT === "true") {
        const clientDist = path.resolve(process.cwd(), "client/dist");
        app.use(express.static(clientDist));
        app.get("*", (_req, res) => {
            res.sendFile(path.join(clientDist, "index.html"));
        });
    }
    // Fly 本番では SERVE_CLIENT=false に設定し、API専用運用
}
/* ---------- サーバ起動 ---------- */
app.listen(PORT, process.env.HOST, () => {
    console.log(`🚀 Server running on http://${process.env.HOST}:${PORT}`);
});
