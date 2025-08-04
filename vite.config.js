import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  root: path.resolve(process.cwd(), "client"),
  base: "/",
  
  plugins: [react()],
  
  build: {
    outDir: path.resolve(process.cwd(), "dist/client"),
    emptyOutDir: true,
    sourcemap: true,
  },
  
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
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
    allowedHosts: [
      ".fly.dev",
      ".replit.dev", 
      ".kirk.replit.dev",
      "ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev"
    ],
    port: 5000,
    host: true,
  },
});