import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";

dotenv.config();

process.env.HOST = process.env.HOST || "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;

/* ---------- middlewares ---------- */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://*.replit.dev',
    'https://*.fly.dev',
    'https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev'
  ],
  credentials: true
}));

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

/* ---------- admin routes (オプション) ---------- */
// 管理者用ルートが必要な場合はコメントアウトを外す
// try {
//   const { registerAdminRoutes } = await import("./admin-routes.js");
//   registerAdminRoutes(app);
// } catch (error) {
//   console.log("Admin routes not found, skipping...");
// }

/* ---------- main api routes registration ---------- */
try {
  // simple-routes.js から registerRoutes をインポート
  const { registerRoutes } = await import("./simple-routes.js");
  registerRoutes(app);
} catch (error) {
  // fallback として routes/index.js からインポートを試行
  try {
    const { registerRoutes } = await import("./routes/index.js");
    registerRoutes(app);
  } catch (fallbackError) {
    console.error("Routes registration error:", error);
    console.error("Fallback routes registration error:", fallbackError);
  }
}

/* ---------- frontend serving logic ---------- */
if (process.env.NODE_ENV !== "production") {
  // 開発時：Vite dev middlewareを使用
  try {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, null);
    console.log("🎯 Development mode: Using Vite dev middleware");
  } catch (error) {
    console.error("Vite setup error:", error);
  }
} else {
  // 本番時：SERVE_CLIENT=true の場合のみ静的ファイル配信
  if (process.env.SERVE_CLIENT === "true") {
    const clientDist = path.resolve(process.cwd(), "client/dist");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
    console.log("📦 Production mode: Serving static client files");
  } else {
    console.log(
      "🚫 Production mode: Client serving disabled (SERVE_CLIENT !== 'true')",
    );
  }
}

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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📁 Serve client: ${process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"}`,
  );
});
