// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// .env.local → .env の順で読み込む
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  base: "/",
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? "",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ?? "",
    ),
  },
  server: {
    allowedHosts: [".fly.dev", ".replit.dev"],
    port: parseInt(process.env.PORT ?? "5173", 10), // Replit or ローカル用
    host: true, // 0.0.0.0 で外部アクセスを許可
  },
});
