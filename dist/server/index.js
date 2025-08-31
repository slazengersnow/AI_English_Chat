import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
process.env.HOST = process.env.HOST || "0.0.0.0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 5002;
/* ---------- middlewares ---------- */
// CORS（Replit公開URL / repl.co / localhost からのアクセスを許可）
app.use(cors({
    origin: [
        /\.replit\.dev$/,
        /\.repl\.co$/,
        /.*\.kirk\.replit\.dev$/,
        /.*\..*\.replit\.dev$/,
        "http://localhost:5002",
        "http://localhost:5001",
        "http://127.0.0.1:5002",
        "http://127.0.0.1:5001",
    ],
    credentials: true,
}));
// きつすぎる独自 setHeader は削除（コメントアウトでもOK）
// ❌ 削除: res.setHeader("Content-Security-Policy", "default-src 'none'");
// Helmet で "通すべきものだけ通す" CSP を設定
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'", // Google認証で必要
                "https://js.stripe.com", // Stripe.js
                "https://accounts.google.com", // Google OAuth
                "https://*.googleapis.com", // Google APIs
                "https://*.gstatic.com", // Google静的リソース
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
                "http://localhost:5002",
                "http://localhost:5001",
                "http://127.0.0.1:5002",
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
}));
// Stripe webhook用のraw bodyハンドリング（必要な場合）
try {
    const stripeWebhookRouter = await import("./routes/stripe-webhook.js");
    app.use("/api/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookRouter.default);
}
catch (error) {
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
}
catch (error) {
    console.log("Admin routes not found, skipping...", error);
}
/* ---------- main api routes registration ---------- */
// その後に /api の通常ルートを登録
try {
    // simple-routes.js から registerRoutes をインポート
    const { registerRoutes } = await import("./simple-routes.js");
    registerRoutes(app);
    console.log("✅ Simple routes registered successfully");
}
catch (error) {
    // fallback として routes/index.js からインポートを試行
    try {
        const { registerRoutes } = await import("./routes/index.js");
        registerRoutes(app);
        console.log("✅ Index routes registered successfully");
    }
    catch (fallbackError) {
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
            hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
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
console.log("📦 Forced production mode: Serving static client files from dist/client");
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
    console.log(`📁 Serve client: ${process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"}`);
});
