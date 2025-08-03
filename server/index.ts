// server/index.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes/index.js";
import { registerRoutes as registerMainRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";

// 環境変数読み込み
dotenv.config();

console.log("Debug - Supabase URL:", process.env.VITE_SUPABASE_URL);
console.log(
  "Debug - Supabase Anon Key:",
  process.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + "...",
);

// __dirname 定義
const __dirname = path.resolve();
const rootDir = path.resolve(__dirname, "./dist/client");

const app = express();

app.use(cors());

app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

registerRoutes(app);
registerMainRoutes(app);

app.use(express.static(rootDir));

app.get("/force-demo", (_req, res) => {
  res.sendFile(path.join(__dirname, "force-demo-mode.html"));
});

app.get("/auto-demo", (_req, res) => {
  res.sendFile(path.join(__dirname, "force-demo-redirect.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${port}`);
});
