import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: "application/json" }));

// ✅ 修正：use ではなく直接呼び出すだけ
await registerRoutes(app);

if (process.env.NODE_ENV === "production") {
  const { serveStatic } = await import("./vite-static.js");
  serveStatic(app);
} else {
  const { setupVite } = await import("./vite");
  await setupVite(app, server);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
