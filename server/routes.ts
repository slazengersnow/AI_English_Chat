import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { storage } from "./storage";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import {
  translateRequestSchema,
  problemRequestSchema,
  createCheckoutSessionSchema,
  type TranslateResponse,
  type ProblemResponse,
  type CheckoutSessionResponse,
} from "@shared/schema";
import stripeWebhookRouter from "./routes/stripe-webhook";

// Session-based problem tracking
const sessionProblems = new Map<string, Set<string>>();

declare module "express" {
  interface Request {
    sessionID?: string;
  }
}

function getSessionId(req: Request): string {
  return req.sessionID || req.ip || "default";
}

function getUnusedProblem(sessionId: string, problems: string[]): string | null {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, new Set<string>());
  }
  
  const usedProblems = sessionProblems.get(sessionId)!;
  const availableProblems = problems.filter((p) => !usedProblems.has(p));

  if (availableProblems.length === 0) {
    // Reset if all used
    sessionProblems.delete(sessionId);
    return problems[Math.floor(Math.random() * problems.length)];
  }

  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}

function markProblemAsUsed(sessionId: string, problem: string): void {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, new Set<string>());
  }
  sessionProblems.get(sessionId)!.add(problem);
}

const router = Router();

// Health and utility endpoints
router.use("/webhook", stripeWebhookRouter);
router.get("/health", (req: Request, res: Response) => res.status(200).send("OK"));
router.get("/ping", (req: Request, res: Response) => res.send("pong"));

// Reset daily count for testing
router.post("/reset-daily-count", async (req: Request, res: Response) => {
  try {
    await storage.resetDailyCount();
    const currentCount = await storage.getDailyCount();
    res.json({ 
      message: "Daily count reset successfully", 
      currentCount 
    });
  } catch (error) {
    console.error('Reset daily count error:', error);
    res.status(500).json({ 
      message: "Failed to reset daily count",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple auth middleware
const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "bizmowa.com";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        if (payload.email) userId = payload.email;
      } catch (jwtError) {
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        if (userEmail) userId = userEmail as string;
      }
    }

    const subscription = await storage.getUserSubscription(userId);
    
    if (!subscription || !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
      return res.status(403).json({
        message: "アクティブなサブスクリプションが必要です",
        needsSubscription: true,
      });
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "認証エラーが発生しました" });
  }
};

// User subscription endpoint
router.get("/user-subscription", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "bizmowa.com";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        if (payload.email) userId = payload.email;
      } catch (jwtError) {
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        if (userEmail) userId = userEmail as string;
      }
    }

    let subscription = await storage.getUserSubscription(userId);
    
    if (!subscription) {
      subscription = await storage.updateUserSubscription(userId, {
        subscriptionStatus: "inactive",
        subscriptionType: "standard",
        userId: userId,
        isAdmin: userId === 'slazengersnow@gmail.com',
      });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error("User subscription error:", error);
    res.status(500).json({ 
      message: "サブスクリプション情報の取得に失敗しました",
      error: (error as Error).message 
    });
  }
});

// CRITICAL: Problem generation with daily limit enforcement
router.post("/problem", requireActiveSubscription, async (req: Request, res: Response) => {
  try {
    // STEP 1: Check daily limit FIRST - CRITICAL
    const canProceed = await storage.incrementDailyCount();
    if (!canProceed) {
      console.log("🛑 Daily limit (100) reached - returning 429");
      return res.status(429).json({
        message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
        dailyLimitReached: true,
      });
    }

    // STEP 2: Validate request
    const parseResult = problemRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.error('Schema validation failed:', parseResult.error);
      return res.status(400).json({ 
        message: "Invalid request data", 
        details: parseResult.error.issues 
      });
    }
    
    const { difficultyLevel } = parseResult.data;
    const userId = "bizmowa.com";
    
    // STEP 3: Get previous problems to avoid duplicates
    const previousProblems = await storage.getUserAttemptedProblems(difficultyLevel, userId);
    const attemptedSentences = new Set(previousProblems.map((p) => p.japaneseSentence));

    // STEP 4: Problem sets
    const problemSets: { [key: string]: string[] } = {
      toeic: [
        "会議の資料を準備しておいてください。",
        "売上が前年比20%増加しました。",
        "新しいプロジェクトの進捗はいかがですか。",
        "顧客からのフィードバックを検討する必要があります。",
        "来週までに報告書を提出してください。",
        "クライアントとの打ち合わせが予定されています。",
        "予算の見直しが必要です。",
        "スケジュールを調整いたします。",
        "チームメンバーと連携を取ってください。",
        "納期に間に合うよう努力します。",
        "品質管理の向上が課題です。",
        "マーケティング戦略を検討しています。",
        "競合他社の動向を調査しました。",
        "今四半期の目標を達成しました。",
        "プロジェクトの進捗状況を報告します。",
      ],
      "middle-school": [
        "私は毎日学校に行きます。",
        "今日は雨が降っています。",
        "彼女は本を読むのが好きです。",
        "私たちは昨日映画を見ました。",
        "猫が庭で遊んでいます。",
        "母は夕食を作っています。",
        "友達と公園で遊びました。",
        "宿題を家で終わらせました。",
        "図書館で本を借りました。",
        "音楽を聞くのが大好きです。",
      ],
      "high-school": [
        "環境問題について真剣に考えるべきです。",
        "科学技術の進歩により、生活が便利になりました。",
        "異文化理解は国際社会において重要です。",
        "健康的な生活習慣を維持することが大切です。",
        "教育制度の改革が議論されています。",
        "経済的格差が社会問題となっています。",
        "持続可能な社会の実現が求められています。",
        "デジタル化が急速に進んでいます。",
        "多様性を尊重する社会が理想的です。",
        "コミュニケーション能力は非常に重要です。",
      ],
      "basic-verbs": [
        "毎朝コーヒーを飲みます。",
        "電車で会社に行きます。",
        "友達と映画を見ました。",
        "日本語を勉強しています。",
        "音楽を聞いています。",
        "本を読むのが好きです。",
        "料理を作るのが上手です。",
        "早く寝るようにしています。",
        "毎日運動をしています。",
        "家族と話をしました。",
      ],
      "business-email": [
        "お疲れ様です。資料をお送りします。",
        "会議の件でご相談があります。",
        "添付ファイルをご査収ください。",
        "明日の会議の件でリスケジュールをお願いしたく存じます。",
        "資料の修正版を添付いたします。",
        "ご確認のほど、よろしくお願いいたします。",
        "誠に申し訳ございませんが、添付ファイルに不備がございました。",
        "お忙しいところ恐縮ですが、ご返信をお待ちしております。",
        "来週の打ち合わせの日程調整をさせていただきたく存じます。",
        "議事録を共有いたします。",
      ],
    };

    const allSentences = problemSets[difficultyLevel];
    if (!allSentences) {
      return res.status(400).json({ message: "Invalid difficulty level" });
    }

    const availableSentences = allSentences.filter((sentence) => !attemptedSentences.has(sentence));
    const sentences = availableSentences.length > 0 ? availableSentences : allSentences;

    const sessionId = getSessionId(req);
    const selectedSentence = getUnusedProblem(sessionId, sentences);

    if (!selectedSentence) {
      return res.status(500).json({ message: "No problems available" });
    }

    markProblemAsUsed(sessionId, selectedSentence);

    const response: ProblemResponse = {
      japaneseSentence: selectedSentence,
      hints: [`問題${await storage.getCurrentProblemNumber(userId, difficultyLevel)}`],
    };

    console.log("✅ Problem generated successfully:", selectedSentence);
    res.json(response);
  } catch (error) {
    console.error('Problem generation error:', error);
    res.status(500).json({ 
      message: "問題生成中にエラーが発生しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Translation evaluation
router.post("/translate", async (req: Request, res: Response) => {
  try {
    const { japaneseSentence, userTranslation, difficultyLevel } = translateRequestSchema.parse(req.body);
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      return res.status(500).json({ message: "Anthropic API key not configured" });
    }

    const systemPrompt = `あなたは日本人の英語学習者向けの英語教師です。ユーザーの日本語から英語への翻訳を評価し、以下のJSON形式で返答してください。

重要:すべての説明とフィードバックは必ず日本語で書いてください。

{
  "correctTranslation": "正しい英訳(ネイティブが自然に使う表現)",
  "feedback": "具体的なフィードバック(良い点と改善点を日本語で)",
  "rating": 評価(1=要改善、5=完璧の数値),
  "improvements": ["改善提案1(日本語で)", "改善提案2(日本語で)"],
  "explanation": "文法や語彙の詳しい解説(必ず日本語で)",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}

評価基準:
- 英文はシンプルで実用的(TOEIC700〜800レベル)
- 直訳ではなく自然な英語
- feedback、improvements、explanationはすべて日本語で説明
- 中学生や高校生にも分かりやすい日本語の解説`;

    const userPrompt = `日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

上記の翻訳を評価してください。`;

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    let responseText = content.type === "text" ? content.text : "";
    let parsedResult;
    
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in Claude response");
      }
    }

    const response: TranslateResponse = {
      correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
      feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
      rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
      improvements: parsedResult.improvements || [],
      explanation: parsedResult.explanation || "",
      similarPhrases: parsedResult.similarPhrases || [],
    };

    const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
    const userId = (userEmail as string) || "bizmowa.com";

    // Save training session
    await storage.addTrainingSession({
      userId,
      difficultyLevel,
      japaneseSentence,
      userTranslation,
      correctTranslation: response.correctTranslation,
      feedback: response.feedback,
      rating: response.rating,
    });

    res.json(response);
  } catch (error) {
    console.error('Translation evaluation error:', error);
    res.status(500).json({ 
      message: "翻訳評価中にエラーが発生しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simulation scenarios (placeholder endpoints)
router.get("/simulation-scenarios", async (req: Request, res: Response) => {
  res.json([
    { id: "business", title: "ビジネス会話", description: "オフィスでの日常会話" },
    { id: "travel", title: "旅行", description: "海外旅行での会話" },
    { id: "shopping", title: "ショッピング", description: "お店での会話" },
  ]);
});

router.get("/simulation-scenarios/:id", async (req: Request, res: Response) => {
  const scenarios = {
    business: { id: "business", title: "ビジネス会話", description: "オフィスでの日常会話" },
    travel: { id: "travel", title: "旅行", description: "海外旅行での会話" },
    shopping: { id: "shopping", title: "ショッピング", description: "お店での会話" },
  };
  
  const scenario = scenarios[req.params.id as keyof typeof scenarios];
  if (scenario) {
    res.json(scenario);
  } else {
    res.status(404).json({ message: "Scenario not found" });
  }
});

router.get("/simulation-problem/:scenarioId", async (req: Request, res: Response) => {
  try {
    // Check daily limit for simulation problems too
    const canProceed = await storage.incrementDailyCount();
    if (!canProceed) {
      return res.status(429).json({
        message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
        dailyLimitReached: true,
      });
    }

    const problems = {
      business: [
        { japaneseSentence: "会議の時間を変更してください。", context: "スケジュール調整" },
        { japaneseSentence: "プロジェクトの進捗を報告します。", context: "プロジェクト管理" },
        { japaneseSentence: "来週の打ち合わせの準備をお願いします。", context: "ミーティング準備" },
      ],
      travel: [
        { japaneseSentence: "空港までどうやって行けばいいですか？", context: "交通案内" },
        { japaneseSentence: "ホテルの予約をしたいのですが。", context: "宿泊予約" },
        { japaneseSentence: "観光地への行き方を教えてください。", context: "観光案内" },
      ],
      shopping: [
        { japaneseSentence: "これはいくらですか？", context: "価格確認" },
        { japaneseSentence: "違うサイズはありますか？", context: "商品確認" },
        { japaneseSentence: "レシートをください。", context: "会計" },
      ],
    };

    const scenarioProblems = problems[req.params.scenarioId as keyof typeof problems];
    if (!scenarioProblems) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const randomProblem = scenarioProblems[Math.floor(Math.random() * scenarioProblems.length)];
    res.json(randomProblem);
  } catch (error) {
    console.error('Simulation problem error:', error);
    res.status(500).json({ 
      message: "シミュレーション問題の生成に失敗しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export function registerRoutes(app: Express) {
  app.use("/api", router);
}