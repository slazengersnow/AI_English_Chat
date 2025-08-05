import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

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

  // ✅ パスエイリアス
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
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

  // ✅ サーバー設定（開発環境用）
  server: {
    port: 5000, // ✅ Expressサーバーのポートと合わせる
    host: true, // ✅ 外部アクセス（0.0.0.0）を許可
    allowedHosts: [
      ".replit.dev", // ✅ Replit用
      ".fly.dev", // ✅ Fly.io用
    ],
  },
});
