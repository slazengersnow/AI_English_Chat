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
});
