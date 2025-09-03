import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";

dotenv.config();

process.env.HOST = process.env.HOST || "0.0.0.0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

/* ---------- middlewares ---------- */

// CORS（すべてのReplit公開URLを許可 - より寛容な設定）
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow all Replit domains and localhost
      if (!origin) return callback(null, true); // Allow requests with no origin (mobile apps, etc.)
      
      const allowedPatterns = [
        /\.replit\.dev$/,
        /\.repl\.co$/,
        /\.kirk\.replit\.dev$/,
        /localhost/,
        /127\.0\.0\.1/,
      ];
      
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      callback(null, isAllowed);
    },
    credentials: true,
  }),
);

// きつすぎる独自 setHeader は削除（コメントアウトでもOK）
// ❌ 削除: res.setHeader("Content-Security-Policy", "default-src 'none'");

// Replit環境用のCSP設定（プレビュー対応）
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false, // デフォルト無効化でReplit対応
      directives: {
        "default-src": ["'self'", "https:", "wss:", "'unsafe-inline'"],
        "script-src": [
          "'self'", 
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https:",
          "blob:",
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'", "https:", "wss:"],
        "frame-src": ["'self'", "https:"],
        "font-src": ["'self'", "https:", "data:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

// Stripe webhook用のraw bodyハンドリング（必要な場合）
try {
  const stripeWebhookRouter = await import("./routes/stripe-webhook.js");
  app.use(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    stripeWebhookRouter.default,
  );
} catch (error) {
  console.log("Stripe webhook routes not found, skipping...");
}

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

/* ---------- admin routes registration (優先) ---------- */
// 管理ルート登録（/api/admin配下）
try {
  const { registerAdminRoutes } = await import("./routes/admin.js");
  registerAdminRoutes(app);
  console.log("✅ Admin routes registered successfully");
} catch (error) {
  console.log("Admin routes not found, skipping...", error);
}

/* ---------- main api routes registration ---------- */
// その後に /api の通常ルートを登録
try {
  // simple-routes.js から registerRoutes をインポート
  const { registerRoutes } = await import("./simple-routes.js");
  registerRoutes(app);
  console.log("✅ Simple routes registered successfully");
} catch (error) {
  // fallback として routes/index.js からインポートを試行
  try {
    const { registerRoutes } = await import("./routes/index.js");
    registerRoutes(app);
    console.log("✅ Index routes registered successfully");
  } catch (fallbackError) {
    console.error("Routes registration error:", error);
    console.error("Fallback routes registration error:", fallbackError);
  }
}

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

/* ---------- frontend serving logic ---------- */
// Replit環境では常に本番ビルドを使用（Viteホスト制限回避）
const clientDist = path.resolve(process.cwd(), "dist/client");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
console.log(
  "📦 Forced production mode: Serving static client files from dist/client",
);

/* ---------- 404 handler for API routes ---------- */
app.use("/api/*", (_req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    timestamp: new Date().toISOString(),
  });
});

/* ---------- server start ---------- */
app.listen(PORT, process.env.HOST, () => {
  console.log(`🚀 Server running on http://${process.env.HOST}:${PORT}`);
  console.log(`📊 Health check: http://${process.env.HOST}:${PORT}/health`);
  console.log(`🔍 Introspect: http://${process.env.HOST}:${PORT}/__introspect`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📁 Serve client: ${process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"}`,
  );
});
