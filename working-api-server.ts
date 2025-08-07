// Working API server with proper Vite integration
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// CRITICAL: API routes BEFORE Vite middleware
console.log("🔥 Registering API routes...");

app.get("/api/ping", (req, res) => {
  console.log("🔥 Ping endpoint working!");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem generation endpoint hit:", req.body);
  const { difficultyLevel = "middle_school", sessionId = "default" } = req.body;
  
  try {
    // Level-specific prompts
    const prompts = {
      middle_school: `中学英語レベルの日本語文を1つ作成してください。
【必須条件】
- 基本的な語彙と文法のみ
- 日常生活・学校生活の話題
- 10-15文字程度

JSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}`,
      toeic: `TOEIC600-800点レベルのビジネス英語問題を作成してください。
【必須条件】
- ビジネスシーン（会議・報告・契約など）
- フォーマルな敬語表現
- TOEIC頻出語彙を含む

JSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}`,
    };

    const prompt = prompts[difficultyLevel] || prompts.middle_school;
    
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
    console.error("Problem generation error:", error);
    
    // Fallback responses
    const fallbacks = {
      middle_school: {
        japaneseSentence: "彼女は英語を勉強しています。",
        modelAnswer: "She is studying English.",
        hints: ["study", "English", "present continuous"]
      },
      toeic: {
        japaneseSentence: "来月の四半期会議の議題を準備してください。",
        modelAnswer: "Please prepare the agenda for next month's quarterly meeting.",
        hints: ["prepare", "agenda", "quarterly meeting"]
      }
    };
    
    const fallback = fallbacks[difficultyLevel] || fallbacks.middle_school;
    res.json({
      ...fallback,
      difficulty: difficultyLevel,
      dailyLimitReached: false,
      currentCount: 1,
      dailyLimit: 100
    });
  }
});

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation endpoint hit:", req.body);
  const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
  
  try {
    const evaluationPrompt = `以下の英作文を評価してください：

【問題】${japaneseSentence}
【模範解答】${modelAnswer}
【生徒の回答】${userAnswer}

励ましの言葉を含めて、できるだけ高めの評価をしてください。

JSON形式で返してください：
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
    console.error("Evaluation error:", error);
    
    // Encouraging fallback evaluation
    let rating = 3;
    let feedback = "良い回答です！";
    
    if (userAnswer && userAnswer.trim().length > 0) {
      if (userAnswer.length > 8) {
        rating = 4;
        feedback = "とても良い回答です！意味がしっかり伝わります。";
      } else if (userAnswer.length > 3) {
        rating = 3;
        feedback = "良い回答です。もう少し詳しく表現できればさらに良くなります。";
      } else {
        rating = 2;
        feedback = "頑張りましたね！次回はもう少し詳しく答えてみましょう。";
      }
    }
    
    res.json({
      rating,
      feedback,
      similarPhrases: [
        "She studies English every day.",
        "She is learning English.",
        "She practices English."
      ]
    });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// Vite integration with proper API route exclusion
async function startServer() {
  console.log("🚀 Starting Vite server...");
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: path.resolve("client"),
  });

  app.use(vite.middlewares);

  // CRITICAL: SPA fallback that skips API routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes - let Express handle them
    if (url.startsWith("/api/")) {
      console.log(`🚫 API route ${url} not handled - returning 404`);
      return res.status(404).json({ error: "API endpoint not found" });
    }

    try {
      const template = await vite.transformIndexHtml(url, `
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>AI English Chat</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
      `);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔥 API endpoints available:`);
    console.log(`   GET  /api/ping`);
    console.log(`   POST /api/problem`);
    console.log(`   POST /api/evaluate-with-claude`);
    console.log(`   GET  /api/status`);
  });
}

startServer().catch(console.error);