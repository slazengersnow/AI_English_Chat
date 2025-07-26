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

const app = express();
app.use(cors());

// ✅ Stripe webhook 用のみ raw ボディを使用（順序に注意）
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// ✅ その他の API に対しては JSON パーサーを適用
app.use(express.json());

// ✅ registerRoutes をここで同期的に呼ぶ
registerRoutes(app);

// ✅ 静的ファイル配信
app.use(express.static(path.join(__dirname, "../dist/client")));

// ✅ ヘルスチェック
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// ✅ すべてのルートで index.html を返す（SPA対応）
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/client/index.html"));
});

// ✅ サーバー起動
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
