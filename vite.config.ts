// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// ✅ 環境変数の読み込み（.env.local → .env の順）
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  base: "/", // ✅ ルートパスで読み込む（Fly.io 含む全環境で安定）

  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist/client"), // ✅ 静的ファイルの出力先
    emptyOutDir: true,
    sourcemap: true, // ✅ 任意：デバッグ用にソースマップ
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || "",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || "",
    ),
  },
});
