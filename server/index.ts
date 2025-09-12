import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

console.log("🚀 Bootstrapping server...");

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // プロダクションのみ終了
  } else {
    console.error("🔧 開発環境: サーバー継続中...");
  }
});
// import { registerRoutes } from "./routes/index.js"; // 不完全な実装のためコメントアウト

dotenv.config();

process.env.HOST = process.env.HOST || "0.0.0.0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

/* ---------- middlewares ---------- */

// CORS（Replit公開URL / repl.co / localhost からのアクセスを許可）
app.use(
  cors({
    origin: [
      /\.replit\.dev$/,
      /\.repl\.co$/,
      /.*\.kirk\.replit\.dev$/,
      /.*\..*\.replit\.dev$/,
      "http://localhost:5000",
      "http://localhost:5001",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:5001",
    ],
    credentials: true,
  }),
);

// きつすぎる独自 setHeader は削除（コメントアウトでもOK）
// ❌ 削除: res.setHeader("Content-Security-Policy", "default-src 'none'");

// Helmet で "通すべきものだけ通す" CSP を設定
app.use(
  helmet({
    contentSecurityPolicy: {
      reportOnly: false, // 🔧 CSP有効化（適切な設定で）
      useDefaults: false, // 🚨 デフォルト無効化（Replit環境対応）
      directives: {
        defaultSrc: ["'self'", "data:", "blob:"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'",
          "'unsafe-eval'", // Google認証で必要
          "https://js.stripe.com", // Stripe.js
          "https://accounts.google.com", // Google OAuth
          "https://*.googleapis.com", // Google APIs
          "https://*.gstatic.com", // Google静的リソース
          "https://replit.com", // 🚨 Replit必須
          "https://*.replit.dev", // 🚨 Replit開発環境
          "https://*.kirk.replit.dev", // 🚨 Kirk Replit
          "'unsafe-hashes'", // 🚨 インラインハンドラー許可
        ],
        connectSrc: [
          "'self'",
          "https://sp.replit.com", // 🚨 Replit環境対応
          "ws:", // 🚨 WebSocket全般
          "wss:", // 🚨 セキュアWebSocket全般
          "data:", // 🚨 データURL
          "blob:", // 🚨 Blobデータ
          "https://*.supabase.co",
          "https://*.supabase.net",
          "https://*.supabase.in",
          "wss://*.supabase.co",
          "wss://*.supabase.net",
          "wss://*.supabase.in",
          "https://*.replit.dev",
          "https://*.repl.co",
          "https://*.kirk.replit.dev",
          "http://localhost:5000",
          "http://localhost:5001",
          "http://127.0.0.1:5000",
          "http://127.0.0.1:5001",
          "https://accounts.google.com", // Google OAuth接続
          "https://*.googleapis.com", // Google API接続
          "https://api.stripe.com", // Stripe API
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://replit.com", "https://*.replit.dev"],
        scriptSrcElem: [
          "'self'", 
          "'unsafe-inline'",
          "https://js.stripe.com",
          "https://accounts.google.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "https://replit.com", // 🚨 Replit必須
          "https://*.replit.dev", // 🚨 Replit開発環境
          "https://*.kirk.replit.dev", // 🚨 Kirk Replit
        ],
        frameSrc: [
          "'self'",
          "https://replit.com", // 🚨 Replit必須
          "https://*.replit.dev", // 🚨 Replit開発環境
          "https://*.kirk.replit.dev", // 🚨 Kirk Replit
          "https://*.supabase.co",
          "https://*.supabase.net",
          "https://accounts.google.com", // Google認証iframe
          "https://js.stripe.com", // Stripe iframe
        ],
        frameAncestors: [
          "'self'",
          "https://replit.com",
          "https://*.replit.com",
        ],
        formAction: [
          "'self'",
          "https://accounts.google.com", // Google OAuth
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

// Stripe webhook moved to async loader section

app.use(express.json());

/* ---------- health check ---------- */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

/* ---------- api logging ---------- */
app.use("/api", (req, _res, next) => {
  console.log(`🔍 API REQUEST: ${req.method} ${req.url}`);
  next();
});

/* ---------- IMMEDIATE API ENDPOINTS (NO RACE CONDITIONS) ---------- */
app.get("/api/__ping", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/* ---------- ASYNC ROUTE LOADING WITH TIMEOUT ---------- */
(async () => {
  const importWithTimeout = (importPromise: Promise<any>, ms: number) => 
    Promise.race([
      importPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('import timeout')), ms))
    ]);

  // Load Stripe webhook routes
  try {
    const stripeWebhookRouter = await importWithTimeout(import("./routes/stripe-webhook.ts"), 5000);
    app.use(
      "/api/stripe-webhook",
      express.raw({ type: "application/json" }),
      stripeWebhookRouter.default,
    );
    console.log("✅ Stripe webhook routes loaded");
  } catch (error) {
    console.log("⚠️ Stripe webhook routes skipped:", (error as Error).message);
  }

  // Load admin routes
  try {
    const { registerAdminRoutes } = await importWithTimeout(import("./routes/admin.ts"), 10000);
    registerAdminRoutes(app);
    console.log("✅ Admin routes loaded");
  } catch (error) {
    console.log("⚠️ Admin routes skipped:", (error as Error).message);
  }

  // Load main routes (Claude API)
  try {
    const { registerRoutes } = await importWithTimeout(import("./simple-routes.ts"), 10000);
    registerRoutes(app);
    console.log("✅ Main routes (Claude API) loaded");
  } catch (error) {
    console.log("⚠️ Main routes skipped:", (error as Error).message);
  }

  /* ---------- 404 handler for API routes (AFTER ALL DYNAMIC ROUTES) ---------- */
  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: "API endpoint not found", 
      timestamp: new Date().toISOString(),
    });
  });
  
  console.log("✅ All routes loaded successfully + 404 handler registered");
})();

/* ---------- introspection endpoint (一時的なデバッグ用) ---------- */
app.get("/__introspect", (_req, res) => {
  res.json({
    mounted: {
      api: true,
      adminCreateUser: "/api/admin/create-user",
    },
    env: {
      hasSupabaseUrl: !!(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      ),
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
});

/* ---------- 404 handler moved to async section after routes ---------- */

/* ---------- frontend serving logic ---------- */
// 🎯 シンプルExpress配信：確実な動作
console.log("🎯 シンプルExpress：確実なフロントエンド配信");

const clientRoot = path.resolve(process.cwd(), "client");

// ルートアクセス専用処理
app.get("/", (req, res) => {
  const indexPath = path.join(clientRoot, "index.html");
  console.log(`📄 Index.html配信: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("❌ index.html配信エラー:", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html><head><title>Error</title></head>
        <body><h1>Error loading application</h1><p>${err.message}</p></body></html>
      `);
    }
  });
});

// 基本静的ファイル配信
app.use(express.static(clientRoot));

// src ディレクトリ配信
app.use('/src', express.static(path.join(clientRoot, 'src')));

// その他のSPAルート
app.get("*", (req, res) => {
  if (!req.originalUrl.startsWith('/api') && req.originalUrl !== '/__introspect') {
    console.log(`🔀 SPA Route: ${req.originalUrl}`);
    const indexPath = path.join(clientRoot, "index.html");
    res.sendFile(indexPath);
  }
});

if (false) { // プロダクション環境コードブロック（無効化）
  // プロダクション環境：ビルド済みファイル配信
  const clientDist = path.resolve(process.cwd(), "dist/client");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (!req.originalUrl.startsWith('/api') && req.originalUrl !== '/__introspect') {
      res.sendFile(path.join(clientDist, "index.html"));
    }
  });
  console.log("📦 プロダクション：ビルド済みファイル配信");
}

/* ---------- server start FIRST ---------- */
const HOST = process.env.HOST || "0.0.0.0";

// ✅ ポート設定（フォールバック保証）
const finalPORT = Number(process.env.PORT) || PORT;
console.log(`🔧 ポート設定: PORT=${process.env.PORT} → 最終ポート=${finalPORT}`);

const server = app.listen(finalPORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${finalPORT}`);
  console.log(`📊 Health check: http://${HOST}:${finalPORT}/health`);
  console.log(`🔍 Introspect: http://${HOST}:${finalPORT}/__introspect`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔧 Viteデブサーバー: http://${HOST}:5173 → Express: ${finalPORT}`);
  console.log(
    `📁 Serve client: ${process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"}`,
  );
});

// 🚨 サーバーライフサイクル監視
server.on('error', (error) => {
  console.error('💥 Server Error:', error);
});

server.on('close', () => {
  console.error('🔴 Server Closed');
});

// 🛑 プロセス終了信号監視
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM受信 - グレースフル終了開始');
  server.close(() => console.log('✅ HTTPサーバー終了完了'));
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT受信 (Ctrl+C) - グレースフル終了開始');
  server.close(() => console.log('✅ HTTPサーバー終了完了'));
});

// 🩺 開発環境での生存確認（デバッグ用）
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    console.log(`💓 Server alive: ${new Date().toISOString()}`);
  }, 30000);
}
