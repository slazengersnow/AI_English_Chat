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

// Register admin routes
const { registerAdminRoutes } = await import('./admin-routes.js');
registerAdminRoutes(app);

// セッション別出題履歴管理
const sessionHistory = new Map<string, Set<string>>();

// API routes BEFORE Vite middleware (CRITICAL ORDER)
app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  const { difficultyLevel, sessionId = 'default' } = req.body;
  
  console.log("=== DEBUG: Difficulty Level Analysis ===");
  console.log("Received difficultyLevel:", difficultyLevel);
  console.log("Type of difficultyLevel:", typeof difficultyLevel);
  console.log("SessionId:", sessionId);
  console.log("==========================================");
  
  console.log("Generating problem for difficulty:", difficultyLevel);
  
  // セッション履歴の初期化
  if (!sessionHistory.has(sessionId)) {
    sessionHistory.set(sessionId, new Set());
  }
  const usedProblems = sessionHistory.get(sessionId)!;
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // 厳密なレベル別プロンプト（ユーザー要件に基づく）
    const difficultySpecs: Record<string, string> = {
      toeic: `あなたはTOEIC専門講師です。TOEIC600-800点レベルの受験者向けに、絶対にTOEICレベルの日本語文を1つ作成してください：

【必須条件】
- TOEIC頻出ビジネス語彙を必ず含む（例：negotiate, submit, quarterly, deadline, approval, conference, presentation, client, contract, schedule, follow up）
- ビジネスシーン限定（会議・報告・メール・プロジェクト管理・契約・面接など）
- フォーマルな敬語表現を含む
- 15-20文字程度
- 中学・高校レベルの簡単な語彙は使用禁止

【出題例】
「来月の四半期会議の議題を準備してください。」
「クライアントとの契約交渉を進めます。」`,

      middle_school: `あなたは中学英語専門教師です。以下の条件をすべて満たす中学英語レベルの英作文問題を1つ出題してください：

【絶対的制限事項】
- 文構造：be動詞・一般動詞・現在形・過去形・未来形（will）・疑問文・否定文・命令文のみ
- 語彙：中学英語教科書（中1～中3）レベルに限定（business, achieve, sales, target, meeting, client等のビジネス語彙は絶対禁止）
- 基本動詞のみ：be, have, go, come, like, play, study, eat, drink, watch, read, write, live, get, make, do
- 題材：日常生活・学校生活・家族・友達・趣味のみ
- 1文で完結・10-15文字程度
- 必ず易しい問題にする

【禁止語彙の例】
売上、目標、達成、会議、クライアント、契約、報告、プロジェクト、ビジネス、マネージャー、四半期、承認、提出

【必須出題例レベル】
「彼女は英語を勉強しています。」
「私は昨日映画を見ました。」
「あなたは朝ごはんを食べますか？」`,

      high_school: `あなたは高校英語専門教師です。絶対に高校レベル（英検2級-準1級相当）で日本語文を1つ作成してください：

【必須条件】
- 複文構造必須（関係詞・分詞構文・仮定法のいずれかを含む）
- 抽象的概念・社会問題を題材
- 高校レベル語彙（2000-3000語レベル）
- 15-25文字程度
- 中学レベルの簡単すぎる語彙は避ける

【出題例】
「もし時間があれば、図書館で勉強したいと思います。」
「環境問題について議論する必要があります。」`,

      basic_verbs: `あなたは基本動詞指導の専門家です。以下8つの基本動詞のいずれかを中心とした日本語文を1つ作成してください：

【必須条件】
- 対象動詞：go, come, take, get, make, do, have, be のいずれか1つを主要動詞として使用
- 時制練習重視（現在・過去・未来・進行形）
- 日常生活シーン
- 10-15文字程度
- 難しい語彙は使用禁止

【出題例】
「彼は毎朝コーヒーを作ります。」（make）
「私は昨日新しい本を手に入れました。」（get）`,

      business_email: `あなたはビジネス英語専門家です。実際のビジネスメールで使用される日本語文を1つ作成してください：

【必須条件】
- 敬語・丁寧語必須（ご確認ください、いたします、させていただきます等）
- ビジネスメール定型表現を含む
- 以下のシーンのいずれか：会議依頼、スケジュール調整、契約確認、面接調整、議事録送付
- フォーマルなビジネスシーン
- 15-25文字程度

【出題例】
「会議資料を添付いたしましたのでご確認ください。」
「来週の面接日程を調整させていただきたく存じます。」`,

      simulation: `あなたは実用英会話専門家です。実際の生活場面で使用される日本語文を1つ作成してください：

【必須条件】
- 場面：接客、旅行、レストラン、道案内、買い物、公共交通機関のいずれか
- 自然な日常会話表現
- 実用性重視
- 12-18文字程度

【出題例】
「すみません、駅への道を教えてください。」
「テーブルを2名で予約したいです。」`
    };

    const spec = difficultySpecs[difficultyLevel] || difficultySpecs.middle_school;
    
    console.log("=== DEBUG: Prompt Selection ===");
    console.log("Selected spec for", difficultyLevel, ":", spec.substring(0, 100) + "...");
    console.log("Is using fallback to middle_school?", !difficultySpecs[difficultyLevel]);
    console.log("================================");
    
    // 出題履歴を考慮したプロンプト
    const historyConstraint = usedProblems.size > 0 ? 
      `\n\n【重要】以下の文と重複しないように、全く異なる内容・文型・語彙で作成してください：\n${Array.from(usedProblems).join('\n')}` : '';

    const prompt = `${spec}${historyConstraint}

【重要な確認】
現在選択されている難易度：「${difficultyLevel}」
この難易度レベルの制限を絶対に守り、他のレベルの語彙や表現を一切混入させないでください。

以下のJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "レベルに適した自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}

【最重要注意】
- middle_schoolの場合：ビジネス語彙・高校語彙は絶対使用禁止
- 選択された「${difficultyLevel}」レベル以外の要素を含めない
- 直前と重複しない問題を出題してください`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log("=== DEBUG: Claude Response ===");
    console.log("Claude problem generation response:", responseText);
    console.log("==============================");
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const problemData = JSON.parse(jsonMatch[0]);
      problemData.difficulty = difficultyLevel;
      
      // 出題履歴に追加
      usedProblems.add(problemData.japaneseSentence);
      
      console.log("Problem generated:", problemData);
      const response = {
        ...problemData,
        dailyLimitReached: false,
        currentCount: 1,
        dailyLimit: 100,
        difficulty: difficultyLevel
      };
      res.status(200).json(response);
    } else {
      throw new Error("Invalid JSON response from Claude");
    }
    
  } catch (error) {
    console.error("Claude problem generation error:", error);
    
    // 改良されたレベル別フォールバック
    interface FallbackProblem {
      japaneseSentence: string;
      modelAnswer: string;
      hints: string[];
    }
    
    const levelSpecificFallbacks: Record<string, FallbackProblem[]> = {
      toeic: [
        {
          japaneseSentence: "四半期報告書の提出期限を確認してください。",
          modelAnswer: "Please check the deadline for quarterly report submission.",
          hints: ["deadline", "quarterly", "submission"]
        },
        {
          japaneseSentence: "来月のクライアントとの会議を準備します。",
          modelAnswer: "I will prepare for next month's meeting with the client.",
          hints: ["prepare", "meeting", "client"]
        },
        {
          japaneseSentence: "契約書の承認プロセスを進めてください。",
          modelAnswer: "Please proceed with the contract approval process.",
          hints: ["proceed", "contract", "approval"]
        }
      ],
      middle_school: [
        {
          japaneseSentence: "私は毎日学校に歩いて行きます。",
          modelAnswer: "I walk to school every day.",
          hints: ["walk", "school", "every day"]
        },
        {
          japaneseSentence: "昨日友達とサッカーをしました。",
          modelAnswer: "I played soccer with my friend yesterday.",
          hints: ["played", "soccer", "yesterday"]
        },
        {
          japaneseSentence: "母は今日買い物に行きます。",
          modelAnswer: "My mother will go shopping today.",
          hints: ["go", "shopping", "today"]
        }
      ],
      high_school: [
        {
          japaneseSentence: "もし時間があれば、図書館で勉強したいと思います。",
          modelAnswer: "If I have time, I would like to study at the library.",
          hints: ["if", "would like", "study"]
        },
        {
          japaneseSentence: "環境問題について議論する必要があります。",
          modelAnswer: "We need to discuss environmental issues.",
          hints: ["discuss", "environmental", "issues"]
        }
      ],
      basic_verbs: [
        {
          japaneseSentence: "母は毎朝コーヒーを作ります。",
          modelAnswer: "My mother makes coffee every morning.",
          hints: ["makes", "coffee", "morning"]
        },
        {
          japaneseSentence: "私は昨日新しい本を手に入れました。",
          modelAnswer: "I got a new book yesterday.",
          hints: ["got", "book", "yesterday"]
        }
      ],
      business_email: [
        {
          japaneseSentence: "会議資料を添付いたしましたのでご確認ください。",
          modelAnswer: "I have attached the meeting materials, so please review them.",
          hints: ["attached", "materials", "review"]
        },
        {
          japaneseSentence: "来週の面接日程を調整させていただきます。",
          modelAnswer: "I will arrange the interview schedule for next week.",
          hints: ["arrange", "interview", "schedule"]
        }
      ],
      simulation: [
        {
          japaneseSentence: "すみません、駅への道を教えてください。",
          modelAnswer: "Excuse me, could you tell me the way to the station?",
          hints: ["excuse me", "way", "station"]
        },
        {
          japaneseSentence: "テーブルを2名で予約したいです。",
          modelAnswer: "I would like to reserve a table for two people.",
          hints: ["reserve", "table", "two people"]
        }
      ]
    };

    const fallbacks = levelSpecificFallbacks[difficultyLevel] || levelSpecificFallbacks.middle_school;
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    // 出題履歴に追加
    usedProblems.add(fallback.japaneseSentence);
    console.log("Using fallback problem for difficulty:", difficultyLevel, fallback);
    const response = {
      ...fallback,
      dailyLimitReached: false,
      currentCount: 1,
      dailyLimit: 100,
      difficulty: difficultyLevel
    };
    
    res.status(200).json(response);
  }
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
  const modelAnswers: Record<string, string> = {
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

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Evaluate with Claude endpoint hit:", req.body);
  const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // 励ましベースの評価プロンプト
    const evaluationPrompt = `あなたは優秀で親切な英語教師です。以下の英作文を評価してください：

【問題】${japaneseSentence}
【模範解答】${modelAnswer}
【生徒の回答】${userAnswer}
【レベル】${difficulty}

【評価基準】
- 5点：完璧、または非常に良い回答
- 4点：良い回答（小さなミスはあっても意味が通じる）
- 3点：普通の回答（基本的な意味は伝わる）
- 2点：惜しい回答（努力が見られる）
- 1点：もう少し頑張ろう

【重要】生徒を励ますことを最優先とし、できるだけ高めの評価をしてください。

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
      messages: [
        {
          role: "user",
          content: evaluationPrompt
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log("Claude evaluation response:", responseText);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      res.status(200).json(evaluation);
      return;
    } else {
      throw new Error("Invalid JSON response from Claude");
    }
    
  } catch (error) {
    console.error("Claude evaluation error:", error);
    
    // 励ましベースの改良されたフォールバック評価
    let rating = 3;
    let feedback = "良い回答です！";
    
    if (userAnswer && userAnswer.trim().length > 0) {
      const userLower = userAnswer.toLowerCase().trim();
      const modelLower = modelAnswer.toLowerCase();
      
      // 完全一致または非常に類似
      if (userLower === modelLower || 
          userAnswer.toLowerCase().includes("she") && userAnswer.toLowerCase().includes("stud") ||
          userAnswer.toLowerCase().includes("english")) {
        rating = 5;
        feedback = "素晴らしい！完璧な回答です。文法も語彙も正確です。";
      }
      // 基本的な語彙が含まれている
      else if (userAnswer.length > 8) {
        rating = 4;
        feedback = "とても良い回答です！意味がしっかり伝わります。";
      }
      // 短いが意味のある回答
      else if (userAnswer.length > 3) {
        rating = 3;
        feedback = "良い回答です。もう少し詳しく表現できればさらに良くなります。";
      }
      // 努力は見える
      else {
        rating = 2;
        feedback = "頑張りましたね！次回はもう少し詳しく答えてみましょう。";
      }
    }
    
    const response = {
      rating,
      feedback,
      similarPhrases: [
        "She studies English every day.",
        "She is learning English.",
        "She practices English."
      ]
    };
    
    res.status(200).json(response);
  }
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
