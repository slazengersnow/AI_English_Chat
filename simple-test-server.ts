import express from "express";
import cors from "cors";
import { registerMainRoutes } from './server/routes.js';

const app = express();
const PORT = 5001; // Different port to avoid conflict

app.use(cors());
app.use(express.json());

// Critical debug middleware to track all requests
app.use((req, res, next) => {
  console.log(`🔍 REQUEST: ${req.method} ${req.url}`);
  next();
});

// Simple test routes
app.get("/api/ping", (req, res) => {
  console.log("🔥 PING ENDPOINT HIT!");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.post("/api/problem", (req, res) => {
  console.log("🔥 PROBLEM ENDPOINT HIT!", req.body);
  res.json({ 
    message: "Problem endpoint working", 
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

// Register main routes
registerMainRoutes(app);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});