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
console.log("Debug - Supabase URL:", process.env.VITE_SUPABASE_URL);
console.log("Debug - Supabase Anon Key:", process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...");
// ✅ Vite ビルド出力先
const rootDir = path.resolve(__dirname, "../client"); // dist含め不要
const app = express();
// ✅ CORS
app.use(cors());
// ✅ Stripe webhook 先に設定（順番重要）
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// ✅ 通常のJSONパース
app.use(express.json());
// ✅ ヘルスチェック
app.get("/health", (_req, res) => {
    res
        .status(200)
        .json({ status: "healthy", timestamp: new Date().toISOString() });
});
// ✅ API登録
registerRoutes(app);
// ✅ 静的ファイル配信
app.use(express.static(path.join(rootDir)));
// ✅ デモ用HTML
app.get("/force-demo", (_req, res) => {
    res.sendFile(path.join(__dirname, "force-demo-mode.html"));
});
app.get("/auto-demo", (_req, res) => {
    res.sendFile(path.join(__dirname, "force-demo-redirect.html"));
});
// ✅ SPA fallback
app.get("*", (_req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});
// ✅ サーバー起動
const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
