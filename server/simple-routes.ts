import { Router, type Express, Request, Response } from "express";
import storage from "./storage.js";
import {
  problemRequestSchema,
  translateRequestSchema,
  type ProblemResponse,
  type TranslateResponse,
  trainingSessions,
  userSubscriptions,
} from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";
import { eq, lte, desc, gte } from "drizzle-orm";

const router = Router();

/* -------------------- セッション重複防止 -------------------- */
const sessionProblems = new Map<string, Set<string>>();

function getSessionId(req: Request): string {
  // 同一セッションでの重複出題を抑えるための簡易ID
  return (req.headers["x-session-id"] as string) || req.ip || "default";
}

function getUsedProblems(sessionId: string): Set<string> {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, new Set<string>());
  }
  return sessionProblems.get(sessionId)!;
}

function markProblemAsUsed(sessionId: string, problem: string): void {
  getUsedProblems(sessionId).add(problem);
}

function getUnusedProblem(
  sessionId: string,
  problems: string[],
): string | null {
  const used = getUsedProblems(sessionId);
  const pool = problems.filter((p) => !used.has(p));
  if (pool.length === 0) {
    // 使い切ったらリセット
    used.clear();
    return problems[Math.floor(Math.random() * problems.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/* -------------------- 入力の正規化ヘルパ -------------------- */
const DIFFICULTY_ALIASES: Record<string, string> = {
  // 受け取った値 → 正規化後キー
  toeic: "toeic",
  middle_school: "middle-school",
  "middle-school": "middle-school",
  high_school: "high-school",
  "high-school": "high-school",
  basic_verbs: "basic-verbs",
  "basic-verbs": "basic-verbs",
  business_email: "business-email",
  "business-email": "business-email",
  simulation: "simulation",
};

function normalizeDifficulty(input?: string): string | undefined {
  if (!input) return undefined;
  const lowered = input.toLowerCase();
  const replaced = lowered.replace(/_/g, "-");
  return (
    DIFFICULTY_ALIASES[lowered] || DIFFICULTY_ALIASES[replaced] || undefined
  );
}

function extractDifficultyLevel(body: any): string | undefined {
  // 両方の名前に対応（difficultyLevel / difficulty）
  return normalizeDifficulty(body?.difficultyLevel ?? body?.difficulty);
}

function extractUserTranslation(body: any): string | undefined {
  // 両方の名前に対応（userTranslation / userAnswer）
  return body?.userTranslation ?? body?.userAnswer ?? body?.answer;
}

/* -------------------- 出題セット -------------------- */
const problemSets: Record<string, string[]> = {
  toeic: [
    "会議の資料を準備しておいてください。",
    "売上が前年比20%増加しました。",
    "新しいプロジェクトの進捗はいかがですか。",
    "顧客からのフィードバックを検討する必要があります。",
    "来週までに報告書を提出してください。",
  ],
  "middle-school": [
    "私は毎日学校に行きます。",
    "今日は雨が降っています。",
    "彼女は本を読むのが好きです。",
    "私たちは昨日映画を見ました。",
    "明日は友達と遊びます。",
  ],
  "high-school": [
    "環境問題について考える必要があります。",
    "技術の発展により生活が便利になりました。",
    "多様性を尊重することが大切です。",
    "グローバル化が進んでいます。",
    "持続可能な社会を目指しています。",
  ],
  "basic-verbs": [
    "彼は毎朝走ります。",
    "私は本を読みます。",
    "彼女は料理を作ります。",
    "私たちは音楽を聞きます。",
    "子供たちは公園で遊びます。",
  ],
  "business-email": [
    "会議の件でご連絡いたします。",
    "資料を添付いたします。",
    "ご確認のほど、よろしくお願いいたします。",
    "お忙しいところ恐れ入ります。",
    "ご返信をお待ちしております。",
  ],
  simulation: [
    "レストランで注文をお願いします。",
    "道に迷ったので道案内をお願いします。",
    "体調が悪いので病院に行きたいです。",
    "買い物で値段を聞きたいです。",
    "電車の時刻を確認したいです。",
  ],
};

/* -------------------- 問題出題 -------------------- */
export const handleProblemGeneration = async (req: Request, res: Response) => {
  try {
    const canProceed = await storage.incrementDailyCount();
    if (!canProceed) {
      return res.status(429).json({
        message:
          "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
        dailyLimitReached: true,
      });
    }

    // ★ まずは正規化してから Zod 検証に渡す
    const normalized = {
      difficultyLevel: extractDifficultyLevel(req.body),
    };

    if (!normalized.difficultyLevel) {
      return res.status(400).json({
        message: "Invalid request data",
        hint: "difficulty / difficultyLevel のどちらかでレベルを指定してください（例: 'middle_school' または 'middle-school'）。",
      });
    }

    const parseResult = problemRequestSchema.safeParse(normalized);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid request data",
        details: parseResult.error.issues,
      });
    }

    const { difficultyLevel } = parseResult.data;

    const allSentences = problemSets[difficultyLevel] || problemSets["toeic"];
    const sessionId = getSessionId(req);
    const selectedSentence = getUnusedProblem(sessionId, allSentences);

    if (!selectedSentence) {
      return res.status(500).json({ message: "No problems available" });
    }

    markProblemAsUsed(sessionId, selectedSentence);

    const response: ProblemResponse = {
      japaneseSentence: selectedSentence,
      hints: [`問題 - ${difficultyLevel}`],
    };

    res.json(response);
  } catch (error) {
    console.error("Problem generation error:", error);
    res.status(500).json({
      message: "Problem generation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* -------------------- Claude 評価 -------------------- */
export const handleClaudeEvaluation = async (req: Request, res: Response) => {
  try {
    // ★ まずは正規化
    const normalized = {
      japaneseSentence: req.body?.japaneseSentence,
      userTranslation: extractUserTranslation(req.body),
      difficultyLevel: extractDifficultyLevel(req.body),
    };

    const result = translateRequestSchema.safeParse(normalized);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        error: result.error.issues,
      });
    }

    const { japaneseSentence, userTranslation } = result.data;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return res
        .status(500)
        .json({ message: "Anthropic API key not configured" });
    }

    const systemPrompt = `あなたは日本人の英語学習者向けの経験豊富な英語教師です。ユーザーの日本語から英語への翻訳を詳細に評価し、以下のJSON形式で返答してください。

重要:すべての説明とフィードバックは必ず日本語で書いてください。

{
  "correctTranslation": "正しい英訳(ネイティブが自然に使う表現)",
  "feedback": "具体的なフィードバック(良い点と改善点を日本語で詳しく)",
  "rating": 評価(1=要改善、5=完璧の数値),
  "improvements": ["改善提案1(日本語で)", "改善提案2(日本語で)"],
  "explanation": "文法・語彙・表現について詳細解説(必ず日本語で、具体的に)",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}

重要な評価ポイント:
1. 文法的正確性：時制、語順、前置詞の使い方
2. 語彙選択：単語の選択が適切か、より自然な表現があるか
3. 表現の自然さ：ネイティブが実際に使う表現かどうか
4. 文脈適合性：場面に適した表現レベル（丁寧語、カジュアル等）

説明要件:
- 文法・語彙・表現の観点から具体的に解説
- 「なぜこの表現が良いのか」「どの部分を改善すべきか」を明確に
- 学習者が次回同じような問題に応用できる具体的なアドバイス
- 中学生にも理解できる分かりやすい日本語
- JSON文字列内では改行文字や特殊文字は使わず、\\nを使用してください`;

    const userPrompt = `日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

上記の翻訳を評価してください。`;

    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const content =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      let parsedResult: any;

      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.log("JSON parse failed, attempting cleanup:", parseError);
        try {
          // Clean up content and try again
          let cleanContent = content.replace(/[\x00-\x1F\x7F]/g, '');
          cleanContent = cleanContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          parsedResult = JSON.parse(cleanContent);
        } catch (cleanupError) {
          // Try to extract JSON from content
          const jsonMatch = content?.match?.(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              let jsonContent = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, '');
              jsonContent = jsonContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
              parsedResult = JSON.parse(jsonContent);
            } catch (finalError) {
              console.error("All JSON parsing attempts failed:", finalError);
              parsedResult = {};
            }
          } else {
            parsedResult = {};
          }
        }
      }

      // Check if parsing failed or result is incomplete
      if (!parsedResult || Object.keys(parsedResult).length === 0 || 
          !parsedResult.correctTranslation || 
          parsedResult.correctTranslation === "Translation evaluation failed") {
        console.log("Using enhanced fallback due to invalid Claude response");
        const fallbackResponse = generateFallbackEvaluation(japaneseSentence, normalized.userTranslation || "", normalized.difficultyLevel || "middle-school");
        res.json(fallbackResponse);
        return;
      }

      const response: TranslateResponse = {
        correctTranslation: parsedResult.correctTranslation,
        feedback: parsedResult.feedback,
        rating: Math.max(1, Math.min(5, Number(parsedResult.rating) || 3)),
        improvements: Array.isArray(parsedResult.improvements)
          ? parsedResult.improvements
          : [],
        explanation: parsedResult.explanation,
        similarPhrases: Array.isArray(parsedResult.similarPhrases)
          ? parsedResult.similarPhrases
          : [],
      };

      // Save training session to database
      try {
        const sessionData = {
          difficultyLevel: normalized.difficultyLevel || "middle-school",
          japaneseSentence: japaneseSentence,
          userTranslation: normalized.userTranslation || "",
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        };
        
        const insertResult = await db.insert(trainingSessions).values(sessionData).returning();
        response.sessionId = insertResult[0]?.id;
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue without sessionId if database save fails
      }

      res.json(response);
    } catch (error) {
      console.error("Claude API error:", error);
      // Fallback with database save
      const fallback: TranslateResponse = {
        correctTranslation: "Please coordinate with your team members.",
        feedback: `お疲れ様でした！「${normalized.userTranslation ?? ""}」という回答をいただきました。現在AI評価システムに一時的な問題が発生していますが、継続して学習を続けましょう。`,
        rating: 3,
        improvements: [
          "短く自然な表現を意識しましょう",
          "動詞と時制の一致を確認しましょう",
        ],
        explanation: "システム復旧中のため、詳細な評価ができません。",
        similarPhrases: [
          "Work closely with your teammates.",
          "Collaborate with your team.",
        ],
      };
      
      // Save fallback training session to database
      try {
        const sessionData = {
          difficultyLevel: normalized.difficultyLevel || "middle-school",
          japaneseSentence: japaneseSentence,
          userTranslation: normalized.userTranslation || "",
          correctTranslation: fallback.correctTranslation,
          feedback: fallback.feedback,
          rating: fallback.rating,
        };
        
        const insertResult = await db.insert(trainingSessions).values(sessionData).returning();
        fallback.sessionId = insertResult[0]?.id;
      } catch (dbError) {
        console.error('Database save error for fallback:', dbError);
      }
      
      res.json(fallback);
    }
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      message: "Evaluation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enhanced fallback evaluation function
function generateFallbackEvaluation(japaneseSentence: string, userTranslation: string, difficultyLevel: string): TranslateResponse {
  const modelAnswers: Record<string, string> = {
    "私たちは昨日映画を見ました。": "We watched a movie yesterday.",
    "明日は友達と遊びます。": "I will play with my friends tomorrow.",
    "私は毎日学校に行きます。": "I go to school every day.",
    "今日は雨が降っています。": "It is raining today.",
    "彼女は本を読むのが好きです。": "She likes reading books.",
    "彼は毎朝走ります。": "He runs every morning.",
    "私は本を読みます。": "I read books.",
    "彼女は料理を作ります。": "She cooks meals.",
    "私たちは音楽を聞きます。": "We listen to music.",
    "子供たちは公園で遊びます。": "Children play in the park.",
  };

  const similarPhrases: Record<string, string[]> = {
    "私たちは昨日映画を見ました。": [
      "We saw a film yesterday.",
      "Yesterday, we went to see a movie.",
    ],
    "明日は友達と遊びます。": [
      "I will hang out with my friends tomorrow.",
      "Tomorrow I'm going to spend time with my friends.",
    ],
    "彼女は本を読むのが好きです。": [
      "She enjoys reading books.",
      "Reading books is one of her hobbies.",
    ],
  };

  const correctTranslation = modelAnswers[japaneseSentence] || "Please translate this sentence accurately.";
  
  // Simple evaluation based on user input quality
  let rating = 3;
  let feedback = "良い回答です。継続的な練習で更に向上できます。";
  let improvements = ["自然な英語表現を心がけましょう", "文法と語彙の確認をしましょう"];
  let explanation = "基本的な文構造は理解されています。より自然な表現を使うことで、さらに良い英訳になります。";

  if (!userTranslation || userTranslation.trim().length < 3) {
    rating = 1;
    feedback = "回答が短すぎます。完整な英文で回答してください。";
    improvements = ["完整な英文を作成しましょう", "主語と動詞を含めましょう"];
    explanation = "英訳では主語、動詞、目的語を含む完整な文を作ることが大切です。";
  } else if (userTranslation.toLowerCase().includes("movee") || userTranslation.toLowerCase().includes("bouk")) {
    rating = 2;
    feedback = "スペルミスがあります。正しい英単語を使いましょう。";
    improvements = ["単語のスペルを確認しましょう", "基本的な英単語を覚えましょう"];
    explanation = "英語の基本単語を正確に覚えることで、より良い英訳ができるようになります。";
  }

  return {
    correctTranslation,
    feedback,
    rating,
    improvements,
    explanation,
    similarPhrases: similarPhrases[japaneseSentence] || [
      "Good effort! Keep practicing.",
      "Try using more natural English expressions.",
    ],
  };
}

/* -------------------- ルーティング登録 -------------------- */
export function registerRoutes(app: Express): void {
  const router = Router();
  router.post("/problem", handleProblemGeneration);
  router.post("/evaluate-with-claude", handleClaudeEvaluation);
  
  // Review system endpoints
  router.get("/review-list", async (req: Request, res: Response) => {
    try {
      const reviewProblems = await db
        .select()
        .from(trainingSessions)
        .where(lte(trainingSessions.rating, 2))
        .orderBy(desc(trainingSessions.createdAt))
        .limit(10);
      
      res.json(reviewProblems);
    } catch (error) {
      console.error('Error fetching review list:', error);
      res.status(500).json({ error: 'Failed to fetch review list' });
    }
  });

  router.get("/retry-list", async (req: Request, res: Response) => {
    try {
      const retryProblems = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.rating, 3))
        .orderBy(desc(trainingSessions.createdAt))
        .limit(10);
      
      res.json(retryProblems);
    } catch (error) {
      console.error('Error fetching retry list:', error);
      res.status(500).json({ error: 'Failed to fetch retry list' });
    }
  });

  // Progress report endpoint
  router.get("/progress-report", async (req: Request, res: Response) => {
    try {
      // Use Drizzle ORM queries for better type safety
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get all sessions for calculations
      const allSessions = await db.select().from(trainingSessions);
      
      // Calculate statistics
      const totalSessions = allSessions.length;
      const avgRating = allSessions.length > 0 ? 
        allSessions.reduce((sum, s) => sum + s.rating, 0) / allSessions.length : 0;
      
      const todayCount = allSessions.filter(s => 
        s.createdAt && s.createdAt >= startOfToday).length;
      
      const monthlyCount = allSessions.filter(s => 
        s.createdAt && s.createdAt >= startOfMonth).length;
      
      // Calculate streak (consecutive days of practice)
      const uniqueDates = [...new Set(allSessions
        .filter(s => s.createdAt)
        .map(s => s.createdAt!.toDateString()))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      const todayString = today.toDateString();
      
      if (uniqueDates.includes(todayString) || uniqueDates.length === 0) {
        let currentDate = new Date(today);
        for (const dateStr of uniqueDates) {
          if (dateStr === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Get user subscription info to determine daily limit
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, "default_user"))
        .limit(1);

      // Determine daily limit based on subscription
      let dailyLimit = 50; // Standard default
      if (subscription && subscription.subscriptionType === 'premium') {
        dailyLimit = 100;
      }

      const progressReport = {
        streak: streak,
        monthlyProblems: monthlyCount,
        averageRating: avgRating.toFixed(1),
        todayProblems: todayCount,
        dailyLimit: dailyLimit,
        totalProblems: totalSessions,
        membershipType: subscription?.subscriptionType || 'standard'
      };

      res.json(progressReport);
    } catch (error) {
      console.error('Error fetching progress report:', error);
      res.status(500).json({ error: 'Failed to fetch progress report' });
    }
  });

  // Weekly progress chart data endpoint
  router.get("/weekly-progress", async (req: Request, res: Response) => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSessions = await db
        .select()
        .from(trainingSessions)
        .where(gte(trainingSessions.createdAt, weekAgo))
        .orderBy(desc(trainingSessions.createdAt));
      
      // Group by date
      const dailyProgress: Record<string, any> = {};
      recentSessions.forEach(session => {
        if (session.createdAt) {
          const dateKey = session.createdAt.toDateString();
          if (!dailyProgress[dateKey]) {
            dailyProgress[dateKey] = {
              date: dateKey,
              count: 0,
              totalRating: 0,
              avgRating: 0
            };
          }
          dailyProgress[dateKey].count++;
          dailyProgress[dateKey].totalRating += session.rating;
          dailyProgress[dateKey].avgRating = dailyProgress[dateKey].totalRating / dailyProgress[dateKey].count;
        }
      });

      const chartData = Object.values(dailyProgress).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json(chartData);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      res.status(500).json({ error: 'Failed to fetch weekly progress' });
    }
  });

  app.use("/api", router);
}
