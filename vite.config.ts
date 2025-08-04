// vite.config.ts
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

  // ✅ Supabase 環境変数の注入
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ?? "",
    ),
  },

  // ✅ Replit/Fly.io対策：403防止のための allowedHosts 設定
  server: {
    allowedHosts: [".fly.dev", ".replit.dev"], // ✅ ← ここが超重要
    port: parseInt(process.env.PORT ?? "5173", 10),
    host: true, // 外部アクセスを許可（0.0.0.0）
  },
});
