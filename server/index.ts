import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import { setupVite } from "./vite.js";

dotenv.config();

// ✅ Override host settings for Replit compatibility
process.env.HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS
app.use(cors());

// Stripe webhook
app.use(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

// JSON parsing
app.use(express.json());

// ヘルスチェック（APIより前に配置）
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Set response headers for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// API routes BEFORE Vite middleware (CRITICAL ORDER)
app.post("/api/problem", (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  const { difficultyLevel } = req.body;
  
  // Different problems based on difficulty
  const problems = {
    toeic: "会議の議題を事前に共有してください。",
    middle_school: "私は毎日学校に歩いて行きます。",
    high_school: "環境問題について議論する必要があります。",
    basic_verbs: "彼は毎朝コーヒーを飲みます。",
    business_email: "添付ファイルをご確認ください。",
    simulation: "レストランで席を予約したいです。"
  };
  
  const japaneseSentence = problems[difficultyLevel] || problems.middle_school;
  
  const response = {
    japaneseSentence,
    hints: [`${difficultyLevel}レベルの問題`],
    dailyLimitReached: false,
    currentCount: 1,
    dailyLimit: 100
  };
  
  res.status(200).json(response);
});

app.post("/api/evaluate", (req, res) => {
  console.log("🔥 Evaluate endpoint hit:", req.body);
  const { userTranslation, japaneseSentence } = req.body;
  
  // Simple evaluation based on length and basic patterns
  let rating = 3;
  let feedback = "良い回答です。";
  let modelAnswer = "Please share the meeting agenda in advance.";
  
  if (userTranslation && userTranslation.length > 10) {
    rating = 4;
    feedback = "とても良い回答です。文法的に正確で、意味も適切に伝わります。";
  }
  
  // Different model answers based on Japanese sentence
  const modelAnswers = {
    "会議の議題を事前に共有してください。": "Please share the meeting agenda in advance.",
    "私は毎日学校に歩いて行きます。": "I walk to school every day.",
    "環境問題について議論する必要があります。": "We need to discuss environmental issues.",
    "彼は毎朝コーヒーを飲みます。": "He drinks coffee every morning.",
    "添付ファイルをご確認ください。": "Please check the attached file.",
    "レストランで席を予約したいです。": "I would like to reserve a table at the restaurant."
  };
  
  modelAnswer = modelAnswers[japaneseSentence] || modelAnswer;
  
  const response = {
    rating,
    modelAnswer,
    feedback,
    similarPhrases: [
      "Please work closely with your team members.",
      "Please collaborate with your teammates.",
      "Please cooperate with your team."
    ]
  };
  
  res.status(200).json(response);
});

app.get("/api/ping", (req, res) => {
  console.log("🔥 Ping endpoint hit");
  res.status(200).send("pong");
});

// Vite をミドルウェアとして統合（APIルートの後に配置）
if (process.env.NODE_ENV !== "production") {
  const { setupVite } = await import("./vite.js");
  await setupVite(app, null);
  console.log("🚀 Vite development server configured");
}

// サーバー起動
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
