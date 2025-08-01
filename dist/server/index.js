"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./routes/index");
const stripe_webhook_1 = __importDefault(require("./routes/stripe-webhook"));
// 環境変数読み込み
dotenv_1.default.config();
// .envファイルの内容が正しく読み込まれているか確認
console.log("Debug - Supabase URL:", process.env.VITE_SUPABASE_URL);
console.log("Debug - Supabase Anon Key:", process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...");
// CommonJS で __dirname を取得
const __dirname = path_1.default.resolve();
// Vite のビルド出力先
const rootDir = path_1.default.resolve(__dirname, "./dist/client");
const app = (0, express_1.default)();
// ✅ CORS 設定（必要に応じて制限可）
app.use((0, cors_1.default)());
// ✅ Stripe Webhook 用の raw body パース（順番に注意！）
app.use("/api/stripe-webhook", express_1.default.raw({ type: "application/json" }), stripe_webhook_1.default);
// ✅ 通常の JSON API をパース
app.use(express_1.default.json());
// ✅ ヘルスチェックエンドポイント
app.get("/health", (_req, res) => {
    res
        .status(200)
        .json({ status: "healthy", timestamp: new Date().toISOString() });
});
// ✅ API ルート登録
(0, index_1.registerRoutes)(app);
// ✅ 静的ファイルを配信（Vite のビルド済み SPA）
app.use(express_1.default.static(rootDir));
// ✅ 緊急アクセス用のエンドポイント
app.get("/force-demo", (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, "force-demo-mode.html"));
});
// ✅ 自動デモモード用のエンドポイント
app.get("/auto-demo", (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, "force-demo-redirect.html"));
});
// ✅ SPA の fallback 対応（フロントでルーティングさせる）
app.get("*", (_req, res) => {
    res.sendFile(path_1.default.join(rootDir, "index.html"));
});
// ✅ ポート設定（Replit workflow expects port 5000）
const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
