import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

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
