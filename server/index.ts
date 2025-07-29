// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes/index";
import stripeWebhookRouter from "./routes/stripe-webhook";

// 環境変数読み込み
dotenv.config();

// CommonJS で __dirname を取得
const __dirname = path.resolve();

// Vite のビルド出力先
const rootDir = path.resolve(__dirname, "./client/dist");

const app = express();

// ✅ CORS 設定（必要に応じて制限可）
app.use(cors());

// ✅ Stripe Webhook 用の raw body パース（順番に注意！）
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// ✅ 通常の JSON API をパース
app.use(express.json());

// ✅ ヘルスチェックエンドポイント
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ✅ API ルート登録
registerRoutes(app);

// ✅ 静的ファイルを配信（Vite のビルド済み SPA）
app.use(express.static(rootDir));

// ✅ SPA の fallback 対応（フロントでルーティングさせる）
app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

// ✅ ポート設定（Replit では 5000 が標準）
const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
