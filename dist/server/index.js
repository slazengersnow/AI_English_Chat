// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
// 環境変数読み込み
dotenv.config();
// Node.js ESM 対応で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Vite のビルド出力先
const rootDir = path.resolve(__dirname, "../client");
const app = express();
// ✅ CORS 設定（必要に応じて制限可）
app.use(cors());
// ✅ Stripe Webhook 用の raw body パース（順番に注意！）
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// ✅ 通常の JSON API をパース
app.use(express.json());
// ✅ API ルート登録
registerRoutes(app);
// ✅ 静的ファイルを配信（Vite のビルド済み SPA）
app.use(express.static(rootDir));
// ✅ SPA の fallback 対応（フロントでルーティングさせる）
app.get("*", (_req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});
// ✅ ポート設定（Fly.io では必ず "0.0.0.0" を使う！）
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
