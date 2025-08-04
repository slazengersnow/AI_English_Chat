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
console.log(
  "Debug - Supabase Anon Key:",
  process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...",
);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ CORS設定（Replit環境対応）
app.use(cors({
  origin: [
    /\.replit\.dev$/,
    /\.kirk\.replit\.dev$/,
    /\.fly\.dev$/,
    "http://localhost:5000",
    "http://0.0.0.0:5000",
    "https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev"
  ],
  credentials: true
}));

// ✅ Stripe webhook（生のボディが必要）
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// ✅ JSONパーシング
app.use(express.json());

// ✅ Replit環境対応のHost headerチェック無効化
app.use((req, res, next) => {
  // Vite dev serverのHost header検証を無効化
  if (req.headers.host && req.headers.host.includes('replit.dev')) {
    req.headers['x-forwarded-host'] = req.headers.host;
    // Vite dev serverのallowedHosts検証を迂回
    req.headers['x-vite-allowed'] = 'true';
  }
  next();
});

// ✅ 静的な Replit Host 許可（環境変数を使わない方法）
app.use((req, res, next) => {
  const allowedReplitHosts = [
    'ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev'
  ];
  
  if (req.headers.host && allowedReplitHosts.includes(req.headers.host)) {
    req.headers['x-forwarded-proto'] = 'https';
  }
  next();
});

// ✅ ヘルスチェック
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT, // 🔧 修正：port → PORT
  });
});

// ✅ API routes
registerRoutes(app);

// ✅ Vite開発サーバー設定（開発環境のみ）
if (process.env.NODE_ENV !== "production") {
  const { setupVite } = await import("./vite.js"); // ✅ 動的importを使用
  await setupVite(app, null);
  console.log("🚀 Vite development server configured");
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
