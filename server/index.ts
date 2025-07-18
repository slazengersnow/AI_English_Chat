import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";

// Load environment variables
dotenv.config();

// Fix WebSocket for ESM environment
try {
  const { WebSocket } = await import("ws");
  global.WebSocket = WebSocket;
} catch (e) {
  console.warn("WebSocket setup failed:", e.message);
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
registerRoutes(app);

// Setup Vite (development) or serve static files (production)
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

server.listen(PORT, "0.0.0.0", () => {
  log(`serving on port ${PORT}`);
});
