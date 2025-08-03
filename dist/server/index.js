// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes/index.js";
import { registerRoutes as registerMainRoutes } from "./routes.js";
import stripeWebhookRouter from "./routes/stripe-webhook";
// 環境変数読み込み
dotenv.config();
// .envファイルの内容が正しく読み込まれているか確認
console.log("Debug - Supabase URL:", process.env.VITE_SUPABASE_URL);
console.log("Debug - Supabase Anon Key:", process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...");
// CommonJS で __dirname を取得
const __dirname = path.resolve();
// Vite のビルド出力先
const rootDir = path.resolve(__dirname, "./dist/client");
const app = express();
// ✅ CORS 設定（必要に応じて制限可）
app.use(cors());
// ✅ Stripe Webhook 用の raw body パース（順番に注意！）
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// ✅ 通常の JSON API をパース
app.use(express.json());
// ✅ ヘルスチェックエンドポイント
app.get("/health", (_req, res) => {
    res
        .status(200)
        .json({ status: "healthy", timestamp: new Date().toISOString() });
});
// ✅ API ルート登録
registerRoutes(app);
// ✅ Main API routes (問題生成等)
registerMainRoutes(app);
// ✅ 静的ファイルを配信（Vite のビルド済み SPA）
app.use(express.static(rootDir));
// ✅ 緊急アクセス用のエンドポイント
app.get("/force-demo", (_req, res) => {
    res.sendFile(path.join(__dirname, "force-demo-mode.html"));
});
// ✅ 自動デモモード用のエンドポイント
app.get("/auto-demo", (_req, res) => {
    res.sendFile(path.join(__dirname, "force-demo-redirect.html"));
});
// ✅ SPA の fallback 対応（フロントでルーティングさせる）
app.get("*", (_req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});
// ✅ ポート設定（Replit workflow expects port 5000）
const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
