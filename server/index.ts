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
  process.exit(1);
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
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'",
          "'unsafe-eval'", // Google認証で必要
          "https://js.stripe.com", // Stripe.js
          "https://accounts.google.com", // Google OAuth
          "https://*.googleapis.com", // Google APIs
          "https://*.gstatic.com", // Google静的リソース
        ],
        connectSrc: [
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
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: [
          "'self'",
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

  /* ---------- API Ping Test Endpoint (MUST BE BEFORE 404) ---------- */
  app.get("/api/__ping", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  /* ---------- 404 handler for API routes (MUST BE LAST) ---------- */
  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: "API endpoint not found", 
      timestamp: new Date().toISOString(),
    });
  });
  console.log("✅ 404 handler registered after all routes");
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
// 緊急修正：既存ビルドファイルを使用（TypeScript構文エラー回避）
const clientDist = path.resolve(process.cwd(), "dist/client");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  if (!req.originalUrl.startsWith('/api') && req.originalUrl !== '/__introspect') {
    res.sendFile(path.join(clientDist, "index.html"));
  }
});
console.log(
  "🚀 Emergency fix: Using existing build files to bypass TS errors",
);

/* ---------- server start FIRST ---------- */
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
