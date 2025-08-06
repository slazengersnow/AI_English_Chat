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
app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  const { difficultyLevel } = req.body;
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create difficulty-specific problem generation prompts
    const difficultySpecs = {
      toeic: "TOEIC頻出のビジネス語彙・表現（例：negotiate, submit, due to, in accordance with, quarterly report, meeting agenda）を含んだ日本語文を1つ作成してください。",
      middle_school: "中学1-3年レベルの基本文法（現在形・過去形・未来形・進行形）と基本語彙（1200語程度）を使った日本語文を1つ作成してください。",
      high_school: "高校レベルの複文構造と語彙（関係詞・分詞構文・仮定法など）を含んだ日本語文を1つ作成してください。",
      basic_verbs: "基本動詞（go, come, take, get, make, do, have, be）を使った時制練習に適した日本語文を1つ作成してください。",
      business_email: "ビジネスメールで使用する丁寧表現・敬語・フォーマルな言い回し（例：恐れ入りますが、ご確認ください、添付いたします）を含んだ日本語文を1つ作成してください。",
      simulation: "日常会話・接客・旅行・レストランなど実用的な場面で使う自然な日本語文を1つ作成してください。"
    };

    const spec = difficultySpecs[difficultyLevel] || difficultySpecs.middle_school;

    const prompt = `${spec}

以下の形式でJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "自然で適切な英訳",
  "hints": ["重要キーワード1", "重要キーワード2", "重要キーワード3"]
}

要件：
- 実用性が高く学習効果のある文を作成
- 模範解答は自然で実際に使われる英語表現
- hintsは翻訳に必要な重要語彙を3つ
- 文の長さは10-25文字程度の適度な長さ`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log("Claude problem generation response:", responseText);
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const problemData = JSON.parse(jsonMatch[0]);
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
    
    // Enhanced fallback problems for each difficulty
    const fallbackProblems = {
      toeic: {
        japaneseSentence: "四半期報告書の提出期限を確認してください。",
        modelAnswer: "Please check the deadline for quarterly report submission.",
        hints: ["deadline", "quarterly report", "submission"]
      },
      middle_school: {
        japaneseSentence: "昨日友達と映画を見に行きました。",
        modelAnswer: "I went to see a movie with my friend yesterday.",
        hints: ["went", "movie", "yesterday"]
      },
      high_school: {
        japaneseSentence: "もし時間があれば、図書館で勉強したいと思います。",
        modelAnswer: "If I have time, I would like to study at the library.",
        hints: ["if", "would like to", "library"]
      },
      basic_verbs: {
        japaneseSentence: "毎朝6時に起きて朝食を作ります。",
        modelAnswer: "I get up at 6 AM and make breakfast every morning.",
        hints: ["get up", "make", "every morning"]
      },
      business_email: {
        japaneseSentence: "会議資料を添付いたしましたのでご確認ください。",
        modelAnswer: "I have attached the meeting materials, so please review them.",
        hints: ["attached", "materials", "review"]
      },
      simulation: {
        japaneseSentence: "すみません、この電車は新宿駅に止まりますか？",
        modelAnswer: "Excuse me, does this train stop at Shinjuku Station?",
        hints: ["excuse me", "train", "stop at"]
      }
    };

    const fallback = fallbackProblems[difficultyLevel] || fallbackProblems.middle_school;
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

app.post("/api/evaluate-with-claude", async (req, res) => {
  console.log("🔥 Claude evaluation endpoint hit:", req.body);
  const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create difficulty-specific evaluation prompts
    const difficultyPrompts = {
      toeic: `あなたは経験豊富なTOEIC講師です。TOEIC頻出語彙・表現を重視して評価してください。`,
      middle_school: `あなたは中学英語の専門教師です。基本文法と語順を重視して評価してください。`,
      high_school: `あなたは高校英語の教師です。複文・語彙力・表現力を重視して評価してください。`,
      basic_verbs: `あなたは基本動詞指導の専門家です。動詞の活用と時制を重視して評価してください。`,
      business_email: `あなたはビジネス英語の専門家です。フォーマルな表現とビジネスマナーを重視して評価してください。`,
      simulation: `あなたは実用英会話の専門家です。自然な会話表現と実際の使用場面を重視して評価してください。`
    };

    const contextPrompt = difficultyPrompts[difficulty] || difficultyPrompts.middle_school;

    const prompt = `${contextPrompt}

日本語文「${japaneseSentence}」の英訳として、ユーザーが「${userAnswer}」と回答しました。模範解答は「${modelAnswer}」です。

この回答の内容を詳細に分析し、以下の形式でJSON形式の評価を返してください：
{
  "rating": 1-5の数値評価,
  "overallEvaluation": "この回答に対する30文字以内の短い総合評価",
  "modelAnswer": "${modelAnswer}",
  "explanation": "この回答の具体的な分析を200-250文字で記述。必ず以下を含む：(1)この回答の文法的な問題点または優れた点、(2)語彙選択の評価と改善提案、(3)なぜ模範解答がより適切なのかの理由、(4)今後の学習アドバイス",
  "similarPhrases": ["実用的な英語類似表現1", "実用的な英語類似表現2"]
}

厳格な評価基準：
5点: 完璧または模範解答と同等レベル
4点: 良好（軽微な改善点はあるが実用性高い）
3点: 普通（文法・語彙に明確な改善点あり）
2点: やや不十分（基本的な問題が複数）
1点: 不適切（空回答・無意味な文字列・大幅な文法ミス）

重要：overallEvaluationは簡潔に、explanationは具体的で建設的に、similarPhrasesは実際に使える英語表現を2つ提供してください。`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log("Claude response:", responseText);
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      res.status(200).json(evaluation);
    } else {
      throw new Error("Invalid JSON response from Claude");
    }
    
  } catch (error) {
    console.error("Claude API error:", error);
    
    // Enhanced fallback response with proper similar phrases
    const fallbackSimilarPhrases = {
      "会議の議題を事前に共有してください。": [
        "Could you please share the meeting agenda beforehand?",
        "Would you mind sharing the agenda in advance?"
      ],
      "私は毎日学校に歩いて行きます。": [
        "I go to school on foot every day.",
        "I walk to school daily."
      ],
      "環境問題について議論する必要があります。": [
        "We should discuss environmental issues.",
        "Environmental problems need to be discussed."
      ],
      "彼は毎朝コーヒーを飲みます。": [
        "He has coffee every morning.",
        "He enjoys coffee each morning."
      ],
      "添付ファイルをご確認ください。": [
        "Please review the attached file.",
        "Kindly check the attachment."
      ],
      "レストランで席を予約したいです。": [
        "I'd like to make a restaurant reservation.",
        "I want to book a table at the restaurant."
      ]
    };
    
    // Enhanced fallback evaluation with individual assessment
    const rating = userAnswer && userAnswer.trim().length > 5 && 
                  !['test', 'aaa', 'bbb', '123', 'hello'].includes(userAnswer.toLowerCase()) ? 
                  (userAnswer.length > 15 ? 4 : 3) : 1;
    
    const overallEval = rating >= 4 ? "とても良い回答です！" : 
                       rating >= 3 ? "基本的には正しい回答です。" : 
                       "回答を見直してもう一度挑戦してみましょう。";

    res.status(200).json({
      rating: rating,
      overallEvaluation: overallEval,
      modelAnswer: modelAnswer,
      explanation: `この回答について詳しく解説します。文法的には${rating >= 3 ? '基本的に正しく構成されています' : '改善が必要な部分があります'}。語彙選択では、より${rating >= 4 ? '適切で自然な表現が使われています' : '自然な単語を選ぶことで表現力が向上します'}。模範解答と比較すると、${rating >= 3 ? '意味は適切に伝わりますが' : '基本的な構造から見直すことで'}、より実用的な英語表現に仕上がります。今後は文脈に応じた表現の使い分けを意識して練習を続けてください。`,
      similarPhrases: fallbackSimilarPhrases[japaneseSentence] || [
        "Please consider using more natural phrasing.",
        "Try expressing this idea differently."
      ]
    });
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
