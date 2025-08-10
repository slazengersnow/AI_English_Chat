"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dotenv_1 = require("dotenv");
var cors_1 = require("cors");
var path_1 = require("path");
var url_1 = require("url");
dotenv_1.default.config();
process.env.HOST = process.env.HOST || "0.0.0.0";
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var app = (0, express_1.default)();
var PORT = Number(process.env.PORT) || 8080;
/* ---------- middlewares ---------- */
app.use((0, cors_1.default)());
// Stripe webhook用のraw bodyハンドリング（必要な場合）
try {
    var stripeWebhookRouter = await Promise.resolve().then(function () { return require("./routes/stripe-webhook.js"); });
    app.use("/api/stripe-webhook", express_1.default.raw({ type: "application/json" }), stripeWebhookRouter.default);
}
catch (error) {
    console.log("Stripe webhook routes not found, skipping...");
}
app.use(express_1.default.json());
/* ---------- health check ---------- */
app.get("/health", function (_req, res) {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});
/* ---------- api logging ---------- */
app.use("/api", function (req, _res, next) {
    console.log("\uD83D\uDD0D API REQUEST: ".concat(req.method, " ").concat(req.url));
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
    var registerRoutes = (await Promise.resolve().then(function () { return require("./simple-routes.js"); })).registerRoutes;
    registerRoutes(app);
}
catch (error) {
    // fallback として routes/index.js からインポートを試行
    try {
        var registerRoutes = (await Promise.resolve().then(function () { return require("./routes/index.js"); })).registerRoutes;
        registerRoutes(app);
    }
    catch (fallbackError) {
        console.error("Routes registration error:", error);
        console.error("Fallback routes registration error:", fallbackError);
    }
}
/* ---------- frontend serving logic ---------- */
if (process.env.NODE_ENV !== "production") {
    // 開発時：Vite dev middlewareを使用
    try {
        var setupVite = (await Promise.resolve().then(function () { return require("./vite.js"); })).setupVite;
        await setupVite(app, null);
        console.log("🎯 Development mode: Using Vite dev middleware");
    }
    catch (error) {
        console.error("Vite setup error:", error);
    }
}
else {
    // 本番時：SERVE_CLIENT=true の場合のみ静的ファイル配信
    if (process.env.SERVE_CLIENT === "true") {
        var clientDist_1 = path_1.default.resolve(process.cwd(), "client/dist");
        app.use(express_1.default.static(clientDist_1));
        app.get("*", function (_req, res) {
            res.sendFile(path_1.default.join(clientDist_1, "index.html"));
        });
        console.log("📦 Production mode: Serving static client files");
    }
    else {
        console.log("🚫 Production mode: Client serving disabled (SERVE_CLIENT !== 'true')");
    }
}
/* ---------- 404 handler for API routes ---------- */
app.use("/api/*", function (_req, res) {
    res.status(404).json({
        error: "API endpoint not found",
        timestamp: new Date().toISOString(),
    });
});
/* ---------- server start ---------- */
app.listen(PORT, process.env.HOST, function () {
    console.log("\uD83D\uDE80 Server running on http://".concat(process.env.HOST, ":").concat(PORT));
    console.log("\uD83D\uDCCA Health check: http://".concat(process.env.HOST, ":").concat(PORT, "/health"));
    console.log("\uD83C\uDF0D Environment: ".concat(process.env.NODE_ENV || "development"));
    console.log("\uD83D\uDCC1 Serve client: ".concat(process.env.SERVE_CLIENT || "auto (dev: true, prod: false)"));
});
