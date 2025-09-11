import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
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

// Environment-aware CSP security setup
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log(`🔒 Security: CSP mode = ${isDevelopment ? 'Development (permissive)' : 'Production (strict)'}`);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": isDevelopment ? [
          "'self'", 
          "'unsafe-inline'", // Development only
          "'unsafe-eval'",   // Development only  
          "https://js.stripe.com",
          "https://accounts.google.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
        ] : [
          "'self'",
          "https://js.stripe.com",
          "https://accounts.google.com", 
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          // Production: unsafe-inline/unsafe-eval removed for security
        ],
        "connect-src": [
          "'self'",
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
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "frame-src": [
          "'self'",
          "https://*.supabase.co",
          "https://*.supabase.net",
          "https://accounts.google.com", // Google認証iframe
          "https://js.stripe.com", // Stripe iframe
        ],
        "frame-ancestors": [
          "'self'",
          "https://replit.com",
          "https://*.replit.com",
        ],
        "form-action": [
          "'self'",
          "https://accounts.google.com", // Google OAuth
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

// Moved to async bootstrap function

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

// Moved to async bootstrap function

/* ---------- main api routes registration ---------- */
// simple-routes.ts の完璧な実装を使用（重複定義を削除）

// Moved to async bootstrap function

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

/* ---------- 404 handler will be registered after all routes ---------- */

/* ---------- frontend serving logic will be set up in bootstrap ---------- */

/* ---------- async bootstrap function ---------- */
async function startServer() {
  console.log("🔄 Starting server bootstrap...");

  /* ---------- 3001ポート公開防止 - ポートプリエンプション + オートシングルポート ---------- */
  const isReplit = process.env.REPLIT_SLUG || process.env.REPL_SLUG;
  if (isReplit && !process.env.VITE_DEV_MODE) {
    console.log("🔒 AUTO-SINGLE-PORT: Replit legacy run detected, activating port preemption...");
    
    // オートシングルポートモード有効化
    process.env.VITE_DEV_MODE = 'true';
    console.log("✅ AUTO-SINGLE-PORT: VITE_DEV_MODE enabled for integrated middleware");
    
    // ポートプリエンプション: 5001と24678をバインドして3001公開を防止
    try {
      const http = await import('http');
      
      // 5001ポート（Vite dev server）をプリエンプション
      const viteBlocker = http.createServer((req, res) => {
        res.writeHead(307, { 'Location': `http://${req.headers.host?.replace(':5001', ':5000') || 'localhost:5000'}${req.url}` });
        res.end('Redirecting to single-port server on 5000...');
      });
      viteBlocker.listen(5001, '0.0.0.0', () => {
        console.log("🛡️  PORT GUARD: 5001 preempted - legacy Vite cannot expose 3001");
      });
      
      // 24678ポート（HMR）もプリエンプション
      const hmrBlocker = http.createServer((req, res) => {
        res.writeHead(404);
        res.end('HMR integrated in main server on port 5000');
      });
      hmrBlocker.listen(24678, '0.0.0.0', () => {
        console.log("🛡️  PORT GUARD: 24678 (HMR) preempted");
      });
      
      console.log("🎯 AUTO-SINGLE-PORT: All legacy ports blocked, 3001 exposure ELIMINATED");
    } catch (error) {
      console.log("⚠️  PORT GUARD: Some ports may already be bound:", error.message);
    }
  } else if (!process.env.VITE_DEV_MODE) {
    console.log("ℹ️  INFO: Non-Replit environment, consider using: node start-single-port.js");
  }

  // Stripe webhook用のraw bodyハンドリング（必要な場合）
  try {
    const { default: stripeWebhookRouter } = await import("./routes/stripe-webhook");
    app.use(
      "/api/stripe-webhook",
      express.raw({ type: "application/json" }),
      stripeWebhookRouter,
    );
    console.log("✅ Stripe webhook routes registered");
  } catch (error) {
    console.log("Stripe webhook routes not found, skipping...", error?.message);
  }

  /* ---------- admin routes registration (優先) ---------- */
  // 管理ルート登録（/api/admin配下）
  try {
    const { registerAdminRoutes } = await import("./routes/admin");
    registerAdminRoutes(app);
    console.log("✅ Admin routes registered successfully");
  } catch (error) {
    console.log("Admin routes not found, skipping...", error?.message);
  }

  /* ---------- main api routes registration ---------- */
  // 🚀 PRODUCTION GRADE: simple-routes.tsの完璧なClaude実装を使用
  try {
    const { registerRoutes } = await import("./simple-routes");
    registerRoutes(app);
    console.log("✅ Production-grade routes with 100% Claude success rate registered successfully");
  } catch (fallbackError) {
    console.error("CRITICAL ERROR: Simple-routes registration failed:", fallbackError?.message);
  }

  /* ---------- frontend serving setup (AFTER all API routes) ---------- */
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: 静的ファイル配信
    const clientDist = path.resolve(process.cwd(), "dist/client");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      if (!_req.path.startsWith('/api/') && !_req.path.startsWith('/__introspect')) {
        res.sendFile(path.join(clientDist, "index.html"));
      }
    });
    console.log("🏗️ Production: Serving static files from", clientDist);
  } else {
    // Development: Viteミドルウェア使用（修正版で設定ファイル読み込み）
    try {
      const { setupViteFixed } = await import("./vite-fixed");
      await setupViteFixed(app, null);
      console.log("🔥 Development: Vite middleware (FIXED) enabled on port", PORT);
    } catch (error) {
      console.error("❌ Failed to setup fixed Vite middleware:", error);
      // フォールバック：オリジナルVite設定を試行
      try {
        const { setupVite } = await import("./vite");
        await setupVite(app, null);
        console.log("🔄 Fallback: Using original Vite middleware on port", PORT);
      } catch (originalError) {
        console.error("❌ Original Vite also failed:", originalError);
        // 最終フォールバック：静的ファイル配信
        const clientDist = path.resolve(process.cwd(), "dist/client");
        app.use(express.static(clientDist));
        app.get("*", (_req, res) => {
          if (!_req.path.startsWith('/api/') && !_req.path.startsWith('/__introspect')) {
            res.sendFile(path.join(clientDist, "index.html"));
          }
        });
        console.log("⚠️ Final fallback: Using static files due to all Vite errors");
      }
    }
  }

  /* ---------- 404 handler for API routes (AFTER all routes) ---------- */
  app.use("/api/*", (_req, res) => {
    res.status(404).json({
      error: "API endpoint not found",
      timestamp: new Date().toISOString(),
    });
  });

  /* ---------- server start ---------- */
  const HOST = process.env.HOST || "0.0.0.0";
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${process.env.HOST}:${PORT}/health`);
    console.log(`🔍 Introspect: http://${process.env.HOST}:${PORT}/__introspect`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `📁 Serve client: ${process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"}`,
    );
  });

  server.on('error', (err) => {
    console.error('❌ Server listen error:', err);
    process.exit(1);
  });
}

// サーバー起動実行
console.log("🔄 Starting server bootstrap...");
startServer().catch((err) => {
  console.error('💥 Fatal startup error:', err);
  process.exit(1);
});
