"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
// server/routes/index.ts
var express_1 = require("express");
var chat_js_1 = require("./chat.js");
var user_js_1 = require("./user.js");
var debug_auth_js_1 = require("./debug-auth.js");
// Claude系ハンドラをroutes.tsからインポート
var routes_js_1 = require("../routes.js");
/**
 * /api 配下のルーティングを一括登録する
 * 重要：ここで「だけ」/api/problem 等を定義し、他の場所で重複定義しないこと
 */
function registerRoutes(app) {
    var router = (0, express_1.Router)();
    // ---- サブリソース（そのまま維持） ----
    router.use("/chat", chat_js_1.default);
    router.use("/user", user_js_1.default);
    // ---- デバッグ用 ----
    router.post("/test-auth", debug_auth_js_1.testAuth);
    router.get("/supabase-status", debug_auth_js_1.getSupabaseStatus);
    // ---- Claude関連のコアAPI（明示登録）----
    // ここで /api/problem と /api/evaluate-with-claude を唯一の定義にする
    router.post("/problem", routes_js_1.handleProblemGeneration);
    router.post("/evaluate-with-claude", routes_js_1.handleClaudeEvaluation);
    // 従来の評価エンドポイントが必要なら有効化（routes.ts に export が必要）
    // router.post("/evaluate", handleEvaluate);
    // すべて /api 配下にぶら下げる
    app.use("/api", router);
}
