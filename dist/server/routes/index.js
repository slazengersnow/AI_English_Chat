// server/routes/index.ts
import { Router } from "express";
import chatRoutes from "./chat.js";
import userRoutes from "./user.js";
import { testAuth, getSupabaseStatus } from "./debug-auth.js";
// Claude系ハンドラをroutes.tsからインポート
import { handleProblemGeneration, handleClaudeEvaluation,
// 従来評価が必要ならroutes.ts側でexportして以下をアンコメント
// handleEvaluate,
 } from "../routes.js";
/**
 * /api 配下のルーティングを一括登録する
 * 重要：ここで「だけ」/api/problem 等を定義し、他の場所で重複定義しないこと
 */
export function registerRoutes(app) {
    const router = Router();
    // ---- サブリソース（そのまま維持） ----
    router.use("/chat", chatRoutes);
    router.use("/user", userRoutes);
    // ---- デバッグ用 ----
    router.post("/test-auth", testAuth);
    router.get("/supabase-status", getSupabaseStatus);
    // ---- Claude関連のコアAPI（明示登録）----
    // ここで /api/problem と /api/evaluate-with-claude を唯一の定義にする
    router.post("/problem", handleProblemGeneration);
    router.post("/evaluate-with-claude", handleClaudeEvaluation);
    // 従来の評価エンドポイントが必要なら有効化（routes.ts に export が必要）
    // router.post("/evaluate", handleEvaluate);
    // すべて /api 配下にぶら下げる
    app.use("/api", router);
}
