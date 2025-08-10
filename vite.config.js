"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
var url_1 = require("url");
var dotenv_1 = require("dotenv");
// ✅ ES modules での __dirname 対応
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
// ✅ 環境変数の読み込み（.env.local → .env の順）
dotenv_1.default.config({ path: ".env.local" });
dotenv_1.default.config();
exports.default = (0, vite_1.defineConfig)({
    // ✅ クライアントのエントリーポイント
    root: path_1.default.resolve(__dirname, "client"),
    base: "/",
    plugins: [(0, plugin_react_1.default)()],
    // ✅ ビルド出力先
    build: {
        outDir: path_1.default.resolve(__dirname, "dist/client"),
        emptyOutDir: true,
        sourcemap: true,
    },
    // ✅ パスエイリアス（絶対パスで統一）
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "client/src"), // ✅ client/src に固定
            "@shared": path_1.default.resolve(__dirname, "shared"),
        },
    },
    // ✅ Supabase 環境変数の注入（ビルド時に埋め込む）
    define: {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify((_a = process.env.VITE_SUPABASE_URL) !== null && _a !== void 0 ? _a : ""),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify((_b = process.env.VITE_SUPABASE_ANON_KEY) !== null && _b !== void 0 ? _b : ""),
    },
    // ✅ サーバー設定（開発環境用）
    server: {
        port: 5000, // ✅ Expressサーバーのポートと合わせる
        host: true, // ✅ 外部アクセス（0.0.0.0）を許可
        middlewareMode: true, // ✅ Vite 6 以降での非推奨対応: boolean に統一
        allowedHosts: [
            ".replit.dev", // ✅ Replit用
            ".fly.dev", // ✅ Fly.io用
        ],
    },
});
