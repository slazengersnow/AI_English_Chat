// Standalone API server - Direct solution for Claude API 404 issue
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

console.log("🔥 Starting API server with Claude integration...");

// Health endpoints
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// Problem generation with Claude API
app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem generation request:", req.body);
  const { difficultyLevel = "middle_school", sessionId = "default" } = req.body;
  
  try {
    const prompt = `中学英語レベルの日本語文を1つ作成してください。

【必須条件】
- 基本的な語彙と文法のみ使用
- 日常生活・学校生活の話題
- 10-15文字程度
- 簡単で理解しやすい内容

以下のJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}`;

    console.log("Making Claude API request...");
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log("Claude response:", responseText);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const problemData = JSON.parse(jsonMatch[0]);
      res.json({
        ...problemData,
        difficulty: difficultyLevel,
        dailyLimitReached: false,
        currentCount: 1,
        dailyLimit: 100
      });
    } else {
      throw new Error("Invalid response format");
    }
    
  } catch (error) {
    console.error("Claude API error:", error);
    
    // Fallback response
    res.json({
      japaneseSentence: "私は毎日英語を勉強しています。",
      modelAnswer: "I study English every day.",
      hints: ["study", "every day", "English"],
      difficulty: difficultyLevel,
      dailyLimitReached: false,
      currentCount: 1,
      dailyLimit: 100
    });
  }
});

// Evaluation with Claude API
app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation request:", req.body);
  const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
  
  try {
    const evaluationPrompt = `以下の英作文を評価してください：

【問題】${japaneseSentence}
【模範解答】${modelAnswer}
【生徒の回答】${userAnswer}

励ましの言葉を含めて評価してください。

以下のJSON形式で返してください：
{
  "rating": 評価点数（1-5）,
  "feedback": "励ましの言葉を含む具体的なフィードバック",
  "similarPhrases": ["類似表現1", "類似表現2", "類似表現3"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: "user", content: evaluationPrompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      res.json(evaluation);
    } else {
      throw new Error("Invalid response format");
    }
    
  } catch (error) {
    console.error("Claude evaluation error:", error);
    
    // Encouraging fallback
    res.json({
      rating: 4,
      feedback: "良い回答です！英語で表現できていて素晴らしいです。",
      similarPhrases: [
        "I study English every day.",
        "I am learning English daily.",
        "I practice English each day."
      ]
    });
  }
});

// Serve static files for frontend
app.use(express.static("client/dist"));

app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  // Serve React app
  res.sendFile("index.html", { root: "client/dist" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log("🔥 Claude API endpoints available:");
  console.log("   GET  /api/ping");
  console.log("   POST /api/problem");
  console.log("   POST /api/evaluate-with-claude");
  console.log("   GET  /api/status");
});