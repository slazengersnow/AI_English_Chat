import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ✅ ES modules での __dirname 対応
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 環境変数の読み込み（.env.local → .env の順）
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  // ✅ クライアントのエントリーポイント
  root: path.resolve(__dirname, "client"),
  base: "/",

  plugins: [react()],

  // ✅ ビルド出力先
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
    sourcemap: true,
  },

  // ✅ パスエイリアス（絶対パスで統一）
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"), // ✅ client/src に固定
      "@shared": path.resolve(__dirname, "shared"),
    },
  },

  // ✅ Supabase 環境変数の注入（ビルド時に埋め込む）
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ?? "",
    ),
  },

  // ✅ 開発サーバー設定（修正版）
  server: {
    port: 3000, // ✅ Expressサーバー(5000)と分離
    host: "0.0.0.0", // ✅ 外部アクセス許可
    // middlewareMode: true を削除（独立サーバーとして動作）
    proxy: {
      // ✅ APIリクエストをExpressサーバーにプロキシ
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/__introspect": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    cors: true, // ✅ CORS有効化
  },

  // ✅ 追加の最適化設定
  optimizeDeps: {
    include: ["react", "react-dom", "@supabase/supabase-js"],
  },
});
