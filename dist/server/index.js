// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../dist/client");
const app = express();
app.use(cors());
// ✅ Stripe webhook は raw ボディ使用（順番に注意）
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
// ✅ 通常 JSON のルーティング
app.use(express.json());
registerRoutes(app);
// ✅ 静的ファイルを正確に `/app/dist/client` から配信
app.use(express.static(rootDir));
// ✅ SPA 対応：存在しないすべてのルートは index.html にフォールバック
app.get("*", (_req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});
// ✅ ポート設定
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
