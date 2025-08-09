import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Register main routes
try {
  const { registerRoutes } = await import("./simple-routes.js");
  registerRoutes(app);
} catch (error) {
  console.error("Routes registration error:", error);
}

// Vite middleware - only in development and when SERVE_CLIENT is true
if (process.env.NODE_ENV !== "production" && process.env.SERVE_CLIENT !== "false") {
  const { setupVite } = await import("./vite.js");
  await setupVite(app, null);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});