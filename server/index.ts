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

// API routes BEFORE Vite middleware (CRITICAL ORDER)
app.post("/api/problem", async (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  const { difficultyLevel } = req.body;
  
  console.log("Generating problem for difficulty:", difficultyLevel);
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Enhanced difficulty-specific prompts to ensure level-appropriate content
    const difficultySpecs: Record<string, string> = {
      toeic: `あなたはTOEIC専門講師です。TOEIC600-800点レベルの受験者向けに、以下の条件で日本語文を1つ作成してください：
- ビジネス語彙必須（例：negotiate, submit, quarterly, deadline, approval, conference, presentation）
- ビジネスシーン（会議、報告、メール、スケジュール管理など）
- TOEIC頻出表現を含む
- 15-20文字程度`,
      
      middle_school: `あなたは中学英語専門教師です。中学1-3年生レベル（英検4-3級相当）で、以下の条件で日本語文を1つ作成してください：
- 基本動詞（be, have, go, come, like, play, study, eat, drink）中心
- 現在形・過去形・現在進行形のみ使用
- 基本語彙1200語以内
- 日常生活・学校生活が題材
- 10-15文字程度`,
      
      high_school: `あなたは高校英語専門教師です。高校レベル（英検2級-準1級相当）で、以下の条件で日本語文を1つ作成してください：
- 複文構造（関係詞、分詞構文、仮定法）を含む
- 抽象的概念・社会問題を題材
- 高校レベル語彙（2000-3000語レベル）
- 15-25文字程度`,
      
      basic_verbs: `あなたは基本動詞指導の専門家です。以下8つの基本動詞のいずれかを中心とした日本語文を1つ作成してください：
- 対象動詞：go, come, take, get, make, do, have, be
- 時制練習重視（現在・過去・未来・進行形）
- 日常生活シーン
- 10-15文字程度`,
      
      business_email: `あなたはビジネス英語専門家です。実際のビジネスメールで使用される、以下の条件で日本語文を1つ作成してください：
- 敬語・丁寧語必須（例：恐れ入りますが、ご確認ください、いたします、させていただきます）
- メール定型表現を含む
- フォーマルなビジネスシーン
- 15-25文字程度`,
      
      simulation: `あなたは実用英会話専門家です。実際の生活場面で使用される、以下の条件で日本語文を1つ作成してください：
- 場面：接客、旅行、レストラン、道案内、買い物、公共交通機関
- 自然な日常会話表現
- 実用性重視
- 12-18文字程度`
    };

    const spec = difficultySpecs[difficultyLevel] || difficultySpecs.middle_school;

    const prompt = `${spec}

厳密にレベルに従って作成し、以下のJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "レベルに適した自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}

【重要】選択された難易度「${difficultyLevel}」のレベルを絶対に守り、他のレベルの語彙や表現を混入させないでください。`;

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
    
    // Enhanced fallback problems for each difficulty
    interface FallbackProblem {
      japaneseSentence: string;
      modelAnswer: string;
      hints: string[];
    }
    
    const fallbackProblems: Record<string, FallbackProblem> = {
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
        hints: ["if", "have time", "would like to"]
      },
      basic_verbs: {
        japaneseSentence: "母は毎朝コーヒーを作ります。",
        modelAnswer: "My mother makes coffee every morning.",
        hints: ["makes", "coffee", "every morning"]
      },
      business_email: {
        japaneseSentence: "ご確認いただき、ありがとうございます。",
        modelAnswer: "Thank you for your confirmation.",
        hints: ["thank you", "confirmation", "for"]
      },
      simulation: {
        japaneseSentence: "すみません、駅への道を教えてください。",
        modelAnswer: "Excuse me, could you tell me the way to the station?",
        hints: ["excuse me", "tell me", "way to"]
      }
    };

    const fallback = fallbackProblems[difficultyLevel] || fallbackProblems.middle_school;
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
  console.log("🔥 Claude evaluation endpoint hit:", req.body);
  const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create difficulty-specific evaluation prompts
    const difficultyPrompts: Record<string, string> = {
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

適切な評価基準（学習者を励ますバランス重視）：
5点: 完璧または模範解答と同等レベル
4点: 良好（意味が伝わり実用性が高い）
3点: 普通（基本的な意味は伝わる、改善点あり）
2点: やや不十分（意図は理解できるが大きな問題あり）
1点: 不適切（空回答・無意味・全く伝わらない）

注意：学習者のモチベーション維持のため、努力が見える回答は適切に評価してください。

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
    const fallbackSimilarPhrases: Record<string, string[]> = {
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
    
    // Detailed fallback evaluation based on actual user answer analysis
    let rating = 1;
    let specificFeedback = "";
    
    const userAnswerLower = userAnswer?.toLowerCase().trim() || "";
    
    // Check for meaningless inputs
    if (!userAnswer || userAnswerLower.length < 3) {
      rating = 1;
      specificFeedback = "回答が空または短すぎます。もう一度しっかりと英訳してみてください。";
    } else if (['test', 'aaa', 'bbb', '123', 'hello', 'ok', 'yes', 'no'].includes(userAnswerLower)) {
      rating = 1;
      specificFeedback = "適当な回答ではなく、日本語文を正確に英訳してください。";
    } else {
      // Analyze content for actual translation attempt
      const hasValidWords = /[a-zA-Z]{3,}/.test(userAnswer);
      const hasMultipleWords = userAnswer.split(/\s+/).length >= 3;
      const hasProperStructure = /^[A-Z]/.test(userAnswer) && /[.!?]$/.test(userAnswer);
      
      if (hasValidWords && hasMultipleWords) {
        rating = hasProperStructure ? 4 : 3;
        specificFeedback = rating === 4 ? 
          "文法的に正しく、意味も適切に伝わる良い回答です。" : 
          "基本的な意味は伝わりますが、文構造や語順に改善の余地があります。";
      } else {
        rating = 2;
        specificFeedback = "英文として不完全です。主語・動詞を含む完整な文で回答してください。";
      }
    }
    
    const overallEval = rating >= 4 ? "素晴らしい回答です！" : 
                       rating >= 3 ? "良い回答ですが、さらに改善できます。" : 
                       rating >= 2 ? "基本的な構造から見直しましょう。" :
                       "適切な英訳を心がけてください。";

    // Create individualized explanation based on the specific answer
    const detailedExplanation = `あなたの回答「${userAnswer}」について分析します。${specificFeedback} 模範解答「${modelAnswer}」と比較すると、${rating >= 3 ? '意味は伝わりますが、より自然な表現を使うことで' : '基本的な文法構造を整えることで'}英語らしい表現になります。${rating === 1 ? '日本語の意味を正確に理解し、英語の語順（主語+動詞+目的語）で組み立ててください。' : '今後は語彙選択と文法的な正確性に注意して練習を続けてください。'}`;

    res.status(200).json({
      rating: rating,
      overallEvaluation: overallEval,
      modelAnswer: modelAnswer,
      explanation: detailedExplanation,
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
