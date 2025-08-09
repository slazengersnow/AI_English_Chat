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
// Set SERVE_CLIENT for Replit development
process.env.SERVE_CLIENT = process.env.SERVE_CLIENT || "true";
// Register main routes - use simple-routes directly for minimal setup
try {
    const { registerRoutes } = await import("./simple-routes.js");
    registerRoutes(app);
}
catch (error) {
    console.error("Routes registration error:", error);
}
// Serve static HTML for testing
app.use(express.static("public"));
// Vite middleware disabled due to configuration issues
console.log("Vite middleware disabled - using static file serving");
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
