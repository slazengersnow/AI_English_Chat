import type { Request, Response, NextFunction, RequestHandler } from "express";
import storage from "./storage.js";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  translateRequestSchema,
  problemRequestSchema,
  createCheckoutSessionSchema,
  type TranslateResponse,
  type ProblemResponse,
  type CheckoutSessionResponse,
} from "../shared/schema.js";

// リクエスト検証スキーマ
const ProblemReq = z.object({
  difficultyLevel: z.enum([
    "toeic",
    "middle-school",
    "high-school", 
    "basic-verbs",
    "business-email",
  ]),
  sessionId: z.string().optional(),
});

// 難易度キー → 詳細プロンプト設定
const difficultyPrompts: Record<string, { description: string, constraints: string, examples: string, temperature: number }> = {
  toeic: {
    description: "TOEICレベルのビジネス英語",
    constraints: "15-25文字、ビジネス場面、丁寧語、専門用語使用可、売上・会議・契約・顧客などのテーマ",
    examples: "会議資料を準備してください。 / 売上が前年比20%増加しました。 / 新商品の企画を検討中です。 / 顧客満足度調査を実施します。 / 契約条件を見直す必要があります。",
    temperature: 0.4
  },
  "middle-school": {
    description: "中学1年生レベルの超基本英語",
    constraints: "8-15文字、絶対に1文のみ、現在形・現在進行形・過去形のみ、基本語彙500語以内、複合文・複文は絶対禁止、日常生活の簡単な動作や状態",
    examples: "私は学生です。 / 今日は暑いです。 / 彼は走っています。 / 猫が寝ています。 / 雨が降ります。 / 昨日映画を見ました。 / 母が料理を作ります。",
    temperature: 0.2
  },
  "high-school": {
    description: "高校英語レベル",
    constraints: "18-30文字、複合時制・関係代名詞・仮定法・受動態使用可、抽象的概念・社会問題・将来計画等含む、複文構造も可",
    examples: "環境問題について真剣に考える必要があります。 / 将来の夢を実現するために毎日努力しています。 / 科学技術の発展が社会に与える影響は計り知れません。 / もし時間があれば、海外旅行に行きたいです。",
    temperature: 0.5
  },
  "basic-verbs": {
    description: "基本動詞を使った超シンプルな文",
    constraints: "6-12文字、go/come/eat/see/read/play/watch/study/make/take/get/give等の基本動詞のみ、現在形中心、日常的な動作",
    examples: "私は本を読みます。 / 彼女は音楽を聞きます。 / 友達と遊びます。 / テレビを見ます。 / 公園に行きます。 / 手紙を書きます。 / 写真を撮ります。",
    temperature: 0.3
  },
  "business-email": {
    description: "ビジネスメール用の丁寧な表現",
    constraints: "20-35文字、敬語・丁寧語・謙譲語必須、依頼・確認・報告・謝罪・感謝の表現、ビジネスシーン特有の慣用句",
    examples: "資料をお送りいただけますでしょうか。 / 会議の日程を調整させていただきます。 / ご多忙のところ恐縮ですが、ご確認をお願いいたします。 / お世話になっております。 / ご迷惑をおかけして申し訳ございません。",
    temperature: 0.3
  },
  "simulation": {
    description: "シミュレーション練習用の実践的な文",
    constraints: "15-30文字、実際の状況で使える実践的な表現、日常・旅行・買い物・食事等のシーン",
    examples: "駅までの道を教えてください。 / この商品の値段はいくらですか。 / 予約をキャンセルしたいのですが。 / 今日の天気はどうですか。 / 電話番号を教えてもらえますか。",
    temperature: 0.4
  }
};

// セッションベースの問題追跡（重複防止用）
// バリデーションスキーマ（エンドポイント毎に分離）
const ProblemValidation = z.object({
  difficultyLevel: z.enum([
    "toeic",
    "middle_school", 
    "high_school",
    "basic_verbs",
    "business_email",
    "simulation"
  ])
});

const EvaluateValidation = z.object({
  japaneseSentence: z.string().min(1, "日本語文が必要です"),
  userTranslation: z.string().min(1, "英訳が必要です"),
  difficultyLevel: z.enum([
    "toeic",
    "middle_school",
    "high_school", 
    "basic_verbs",
    "business_email",
    "simulation"
  ])
});

// セッションベースの問題追跡（重複防止用）
const sessionProblems = new Map<string, Set<string>>();

declare module "express" {
  interface Request {
    sessionID?: string;
  }
}

// ヘルパー関数
function getSessionId(req: Request): string {
  return req.sessionID || req.ip || "default";
}

function getUsedProblems(sessionId: string): Set<string> {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, new Set<string>());
  }
  return sessionProblems.get(sessionId)!;
}

function markProblemAsUsed(sessionId: string, problem: string): void {
  const usedProblems = getUsedProblems(sessionId);
  usedProblems.add(problem);
}

function getUnusedProblem(sessionId: string, problems: string[]): string | null {
  const usedProblems = getUsedProblems(sessionId);
  const availableProblems = problems.filter((p) => !usedProblems.has(p));

  if (availableProblems.length === 0) {
    sessionProblems.delete(sessionId);
    return problems[Math.floor(Math.random() * problems.length)];
  }

  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}

// 価格設定
const priceConfig = {
  test: {
    standard_monthly: "price_1RjslTHridtc6DvMCNUU778G",
    standard_yearly: "price_1RjsmiHridtc6DvMWQXBcaJ1",
    premium_monthly: "price_1RjslwHridtc6DvMshQinr44",
    premium_yearly: "price_1Rjsn6Hridtc6DvMGQJaqBid",
  },
  production: {
    standard_monthly: "price_1ReXHSHridtc6DvMOjCbo2VK",
    standard_yearly: "price_1ReXOGHridtc6DvM8L2KO7KO",
    premium_monthly: "price_1ReXP9Hridtc6DvMpgawL58K",
    premium_yearly: "price_1ReXPnHridtc6DvMQaW7NC6w",
  },
};

function getPlanTypeFromPriceId(priceId: string): string {
  const currentMode = process.env.STRIPE_MODE || "test";
  const currentPrices = priceConfig[currentMode as keyof typeof priceConfig];

  if (
    priceId === currentPrices.standard_monthly ||
    priceId === currentPrices.standard_yearly
  ) {
    return "standard";
  } else if (
    priceId === currentPrices.premium_monthly ||
    priceId === currentPrices.premium_yearly ||
    priceId === (process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf")
  ) {
    return "premium";
  }
  return "standard";
}

// ============================================================================
// ミドルウェア関数
// ============================================================================

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "anonymous";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString(),
        );
        if (payload.email) {
          userId = payload.email;
        }
      } catch (jwtError) {
        console.log("JWT parsing failed, using fallback:", jwtError);
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        if (userEmail) {
          userId = userEmail as string;
        }
      }
    }

    console.log("Checking subscription for user:", userId);
    const subscription = await storage.getUserSubscription(userId);

    if (
      !subscription ||
      !["active", "trialing"].includes(subscription.subscriptionStatus || "")
    ) {
      console.log("No valid subscription found for user:", userId);
      return res.status(403).json({
        message: "アクティブなサブスクリプションが必要です",
        needsSubscription: true,
      });
    }

    console.log("Valid subscription found:", subscription);
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res
      .status(500)
      .json({ message: "サブスクリプション確認中にエラーが発生しました" });
  }
};

export const requirePremiumSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
    let userId = "anonymous";

    if (userEmail) {
      userId = userEmail as string;
    }

    console.log("Checking premium subscription for user:", userId);
    const subscription = await storage.getUserSubscription(userId);

    if (
      !subscription ||
      subscription.subscriptionType !== "premium" ||
      !["active", "trialing"].includes(subscription.subscriptionStatus || "")
    ) {
      console.log("No valid premium subscription found for user:", userId);
      return res.status(403).json({
        message: "プレミアムプランが必要です",
        needsPremium: true,
      });
    }

    console.log("Valid premium subscription found:", subscription);
    next();
  } catch (error) {
    console.error("Premium subscription check error:", error);
    res
      .status(500)
      .json({ message: "プレミアムサブスクリプションの確認に失敗しました" });
  }
};

// ============================================================================
// 基本エンドポイント
// ============================================================================

export const handleHealth: RequestHandler = (req: Request, res: Response) => {
  res.status(200).send("OK");
};

export const handlePing: RequestHandler = (req: Request, res: Response) => {
  res.send("pong");
};

export const handleEcho: RequestHandler = (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  res.json({ sessionId, data: req.body });
};

// ============================================================================
// 認証関連
// ============================================================================

export const handleSignup: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    await storage.updateUserSubscription("default_user", {
      subscriptionStatus: "inactive",
      userId: "default_user",
    });

    res.json({
      success: true,
      message: "アカウントが作成されました",
      needsSubscription: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ message: "アカウント作成に失敗しました" });
  }
};

export const handleLogin: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const subscription = await storage.getUserSubscription();
    const needsSubscription =
      !subscription ||
      !["active", "trialing"].includes(subscription.subscriptionStatus || "");

    res.json({
      success: true,
      message: "ログインしました",
      needsSubscription,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "ログインに失敗しました" });
  }
};

export const handleGetUserSubscription: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "anonymous";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString(),
        );
        if (payload.email) {
          userId = payload.email;
        }
      } catch (jwtError) {
        console.log("JWT parsing failed, using fallback:", jwtError);
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        if (userEmail) {
          userId = userEmail as string;
        }
      }
    }

    console.log("Getting subscription for user:", userId);
    const subscription = await storage.getUserSubscription(userId);

    if (!subscription) {
      console.log("No subscription found, creating default for user:", userId);
      const defaultSubscription = await storage.updateUserSubscription(userId, {
        subscriptionStatus: "inactive",
        subscriptionType: "standard",
        userId: userId,
        isAdmin: userId === 'slazengersnow@gmail.com',
      });
      return res.json(defaultSubscription);
    }

    console.log("Found subscription:", subscription);
    return res.json(subscription);
  } catch (error) {
    console.error("User subscription error:", error);
    return res.status(500).json({ 
      message: "サブスクリプション情報の取得に失敗しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// 問題生成
// ============================================================================

export const handleProblemGeneration: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('Problem generation request body:', req.body);

    // リクエストデータの検証（/problem エンドポイント専用）
    const parsed = ProblemValidation.safeParse(req.body);
    if (!parsed.success) {
      console.error('Problem validation failed:', parsed.error);
      return res.status(400).json({
        message: "difficultyLevelが必要です",
        issues: parsed.error.issues,
      });
    }

    const { difficultyLevel } = parsed.data;
    console.log('Schema validation passed, difficultyLevel:', difficultyLevel);

    const userId = "anonymous"; // TODO: 実装時に実際のユーザーIDを取得
    
    // 日次制限チェック（管理者は無制限）
    const isAdminUser = userId === 'slazengersnow@gmail.com';
    if (!isAdminUser) {
      const canProceed = await storage.incrementDailyCount();
      if (!canProceed) {
        return res.status(429).json({
          message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
          dailyLimitReached: true,
        });
      }
    }
    console.log('Fetching previous problems for user:', userId);

    // 過去の問題履歴を取得（重複回避）
    const previousProblems = await storage.getUserAttemptedProblems(
      difficultyLevel,
      userId,
    );
    console.log('Previous problems fetched, count:', previousProblems.length);

    const attemptedSentences = new Set(
      previousProblems.map((p) => p.japaneseSentence),
    );
    console.log('Attempted sentences set created, size:', attemptedSentences.size);

    // 難易度に対応する詳細設定を取得
    const promptConfig = difficultyPrompts[difficultyLevel];
    if (!promptConfig) {
      return res.status(400).json({
        message: `Unsupported difficulty level: ${difficultyLevel}`,
        dailyLimitReached: false,
      });
    }

    // Anthropic APIの設定
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("Anthropic API key not configured");
      return res.status(500).json({
        message: "AI問題生成システムが設定されていません",
        dailyLimitReached: false,
      });
    }

    // Claudeに渡す厳密なプロンプト
    const prompt = `あなたは英作文の出題者です。以下の厳密な条件で「日本語文を1つだけ」出してください。

【レベル】${promptConfig.description}
【制約】${promptConfig.constraints}
【例】${promptConfig.examples}

【絶対ルール】
- 日本語の文のみ出力（説明・番号・前後の文字は一切禁止）
- 文字数制約を厳守
- 例と同レベルの難易度を維持
- 自然で学習効果の高い文章

出力：日本語文のみ`.trim();

    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        temperature: promptConfig.temperature,
        messages: [{ role: "user", content: prompt }],
      });

      const japaneseSentence = response.content[0].type === "text" 
        ? response.content[0].text.trim() 
        : "明日は会議の準備をしてください。";

      // 重複チェック（既に出題済みの場合は別の問題を生成）
      if (attemptedSentences.has(japaneseSentence) && attemptedSentences.size < 50) {
        console.log("Generated sentence already used, trying again...");

        const retryPrompt = `${prompt}

以下の文は既に出題済みなので避けてください：
${Array.from(attemptedSentences).slice(-5).join("、")}`.trim();

        try {
          const retryResponse = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 100,
            temperature: Math.min(promptConfig.temperature + 0.2, 0.8), // retry時は少し温度を上げる
            messages: [{ role: "user", content: retryPrompt }],
          });

          const newSentence = retryResponse.content[0].type === "text"
            ? retryResponse.content[0].text.trim()
            : japaneseSentence;

          const problemResponse: ProblemResponse = {
            japaneseSentence: newSentence,
            hints: [`問題${await storage.getCurrentProblemNumber(userId, difficultyLevel)}`],
          };

          console.log("Successfully generated new problem:", newSentence);
          return res.json({
            ...problemResponse,
            difficultyLevel,
            dailyLimitReached: false,
            currentCount: await storage.getTodaysProblemCount(),
            dailyLimit: 100,
          });

        } catch (retryError) {
          console.log("Retry failed, using original sentence");
        }
      }

      const problemResponse: ProblemResponse = {
        japaneseSentence,
        hints: [`問題${await storage.getCurrentProblemNumber(userId, difficultyLevel)}`],
      };

      console.log("Successfully generated problem:", japaneseSentence);
      return res.json({
        ...problemResponse,
        difficultyLevel,
        dailyLimitReached: false,
        currentCount: await storage.getTodaysProblemCount(),
        dailyLimit: 100,
      });

    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);

      // フォールバック: 静的な問題セット
      const fallbackProblems = {
        toeic: [
          "会議の資料を準備しておいてください。",
          "売上が前年比20%増加しました。",
          "新しいプロジェクトの進捗はいかがですか。",
          "顧客からのフィードバックを検討する必要があります。",
          "来週までに報告書を提出してください。",
        ],
        "middle-school": [
          "私は学生です。",
          "今日は暑いです。",
          "彼は走っています。",
          "猫が寝ています。",
          "雨が降ります。",
          "本を読みます。",
          "音楽を聞きます。",
          "友達と話します。",
        ],
        "high-school": [
          "環境問題について真剣に考える必要があります。",
          "将来の夢を実現するために毎日努力しています。",
          "科学技術の発展が社会に与える影響は大きいです。",
          "この経験から多くのことを学ぶことができました。",
          "もし時間があれば、海外旅行に行きたいです。",
          "教育の重要性について議論する時間が必要です。",
          "彼が成功した理由を詳しく分析してみましょう。",
          "困難な状況でも諦めずに努力を続けることが大切です。",
        ],
        "basic-verbs": [
          "本を読みます。",
          "音楽を聞きます。",
          "友達と遊びます。",
          "テレビを見ます。",
          "公園に行きます。",
          "料理を作ります。",
          "手紙を書きます。",
          "電話をかけます。",
        ],
        "business-email": [
          "お世話になっております。",
          "会議の件でご連絡いたします。",
          "添付ファイルをご査収ください。",
          "資料をお送りいただけますでしょうか。",
          "会議の日程を調整させていただきます。",
          "ご多忙のところ恐縮ですが、ご確認をお願いいたします。",
          "ご迷惑をおかけして申し訳ございません。",
          "いつもお世話になり、誠にありがとうございます。",
        ],
        "simulation": [
          "駅までの道を教えてください。",
          "この商品の値段はいくらですか。",
          "予約をキャンセルしたいのですが。",
          "今日の天気はどうですか。",
          "電話番号を教えてもらえますか。",
          "レストランでテーブルを予約したいです。",
          "空港までタクシーをお願いします。",
          "おすすめの料理はありますか。",
        ],
      };

      const problemSet = fallbackProblems[difficultyLevel] || fallbackProblems["middle-school"];
      const availableProblems = problemSet.filter(
        (sentence) => !attemptedSentences.has(sentence),
      );
      const selectedSentence = availableProblems.length > 0 
        ? availableProblems[Math.floor(Math.random() * availableProblems.length)]
        : problemSet[Math.floor(Math.random() * problemSet.length)];

      const problemResponse: ProblemResponse = {
        japaneseSentence: selectedSentence,
        hints: [`問題${await storage.getCurrentProblemNumber(userId, difficultyLevel)}`],
      };

      console.log("Using fallback problem:", selectedSentence);
      return res.json({
        ...problemResponse,
        difficultyLevel,
        dailyLimitReached: false,
        currentCount: await storage.getTodaysProblemCount(),
        dailyLimit: 100,
      });
    }

  } catch (error) {
    console.error('Problem generation error:', error);
    return res.status(500).json({
      message: "問題の生成に失敗しました。",
      dailyLimitReached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// Claude評価
// ============================================================================

export const handleClaudeEvaluation: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    // リクエストデータの検証（/evaluate-with-claude エンドポイント専用）
    const parseResult = EvaluateValidation.safeParse(req.body);
    if (!parseResult.success) {
      console.error('Evaluate validation failed:', parseResult.error);
      return res.status(400).json({
        message: "japaneseSentence, userTranslation, difficultyLevelが必要です",
        issues: parseResult.error.issues,
      });
    }

    const { japaneseSentence, userTranslation, difficultyLevel } = parseResult.data;
    console.log('Translation evaluation request:', { japaneseSentence, userTranslation, difficultyLevel });

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("Anthropic API key not configured");
      return res.status(500).json({ 
        message: "AI評価システムが設定されていません" 
      });
    }

    // 難易度に応じた評価指示
    const levelLabel = difficultyPrompts[difficultyLevel] || "基本的な文章";

    const systemPrompt = `あなたは日本人の英語学習者向けの英語教師です。${levelLabel}レベルの翻訳を評価し、以下のJSON形式で返答してください。

重要: すべての説明とフィードバックは必ず日本語で書いてください。

{
  "correctTranslation": "正しい英訳(ネイティブが自然に使う表現)",
  "feedback": "具体的なフィードバック(良い点と改善点を日本語で)",
  "rating": 評価(1=要改善、5=完璧の数値),
  "improvements": ["改善提案1(日本語で)", "改善提案2(日本語で)"],
  "explanation": "文法や語彙の詳しい解説(必ず日本語で)",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}

評価基準:
- レベル: ${levelLabel}
- 英文はシンプルで実用的
- 直訳ではなく自然な英語
- feedback、improvements、explanationはすべて日本語で説明
- 学習者にとって分かりやすい日本語の解説`.trim();

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

      const content = message.content[0];
      let responseText = content.type === "text" ? content.text : "";
      let parsedResult;

      try {
        parsedResult = JSON.parse(responseText);
      } catch (parseError) {
        // JSONの抽出を試行
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in Claude response");
        }
      }

      // レスポンスの検証と正規化
      const response: TranslateResponse = {
        correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
        feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
        rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
        improvements: Array.isArray(parsedResult.improvements) ? parsedResult.improvements : [],
        explanation: parsedResult.explanation || "解説の生成に失敗しました",
        similarPhrases: Array.isArray(parsedResult.similarPhrases) ? parsedResult.similarPhrases : [],
      };

      // 学習セッションの記録
      const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
      const userId = (userEmail as string) || "anonymous";

      try {
        const trainingSession = await storage.addTrainingSession({
          userId,
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        });

        const currentProblemNumber = await storage.getCurrentProblemNumber(
          userId,
          difficultyLevel,
        );
        await storage.updateProblemProgress(
          userId,
          difficultyLevel,
          currentProblemNumber + 1,
        );

        console.log("Training session recorded successfully:", trainingSession.id);
        return res.json({ ...response, sessionId: trainingSession.id });

      } catch (storageError) {
        console.error("Storage error:", storageError);
        // ストレージエラーでも評価結果は返す
        return res.json({ ...response, sessionId: 0 });
      }

    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);

      // 高度なフォールバック評価システム
      const fallbackEvaluation = generateFallbackEvaluation(
        userTranslation,
        japaneseSentence,
        difficultyLevel
      );

      // ストレージ記録を試行
      try {
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        const userId = (userEmail as string) || "anonymous";

        const trainingSession = await storage.addTrainingSession({
          userId,
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: fallbackEvaluation.correctTranslation,
          feedback: fallbackEvaluation.feedback,
          rating: fallbackEvaluation.rating,
        });

        return res.json({ ...fallbackEvaluation, sessionId: trainingSession.id });
      } catch (storageError) {
        return res.json({ ...fallbackEvaluation, sessionId: 0 });
      }
    }

  } catch (error) {
    console.error("Translation evaluation error:", error);
    return res.status(500).json({ 
      message: "翻訳評価に失敗しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// フォールバック評価生成関数
function generateFallbackEvaluation(
  userTranslation: string,
  japaneseSentence: string,
  difficultyLevel: string
): TranslateResponse {
  let rating = 1;
  let specificFeedback = "";

  const userAnswerLower = userTranslation?.toLowerCase().trim() || "";

  // 入力内容の分析
  if (!userTranslation || userAnswerLower.length < 3) {
    rating = 1;
    specificFeedback = "回答が空または短すぎます。完整な英文で回答してください。";
  } else if (
    ["test", "aaa", "bbb", "123", "hello", "ok", "yes", "no"].includes(userAnswerLower)
  ) {
    rating = 1;
    specificFeedback = "適当な回答ではなく、日本語文を正確に英訳してください。";
  } else {
    // 実際の翻訳試行の分析
    const hasValidWords = /[a-zA-Z]{3,}/.test(userTranslation);
    const hasMultipleWords = userTranslation.split(/\s+/).length >= 3;
    const hasProperStructure = /^[A-Z]/.test(userTranslation) && /[.!?]$/.test(userTranslation);

    if (hasValidWords && hasMultipleWords) {
      if (hasProperStructure && hasValidWords) {
        rating = 4;
        specificFeedback = "良い回答です。文法構造が適切で意味も明確に伝わります。";
      } else if (hasValidWords) {
        rating = 3;
        specificFeedback = "基本的な意味は伝わります。この調子で続けましょう。";
      } else {
        rating = 2;
        specificFeedback = "英文として不完全な部分があります。文法を確認してみてください。";
      }
    } else {
      rating = 2;
      specificFeedback = "英文として不完全です。完整な文で回答してください。";
    }
  }

  // 難易度別のモデル回答
  const modelAnswers: Record<string, string> = {
    toeic: "Please prepare the meeting materials.",
    "middle-school": "I go to school every day.",
    "high-school": "It is important to think about environmental issues.",
    "basic-verbs": "He makes coffee every morning.",
    "business-email": "Thank you for your kind assistance.",
  };

  const correctTranslation = modelAnswers[difficultyLevel] || "Please translate this sentence accurately.";

  const overallEvaluations = [
    ["完璧な英訳です！", "ネイティブレベルの表現力が身についています。"],
    ["素晴らしい回答です！", "文法・語彙ともに適切で、相手に正確に意図が伝わります。"],
    ["良い回答です。", "意味は十分伝わりますが、より自然な表現を意識すると更に良くなります。"],
    ["基本的な構造から見直しましょう。", "英語の文法ルールを確認して、正確な文章作りを心がけてください。"],
    ["英訳の基礎から練習しましょう。", "日本語の意味を正確に理解し、英語の語順で組み立てる練習を重ねてください。"],
  ];

  const feedback = overallEvaluations[5 - rating]?.[0] || "回答を見直しましょう。";
  const explanation = `${specificFeedback}\n\n${overallEvaluations[5 - rating]?.[1] || "基本的な英語表現から確認してみてください。"}\n\n継続的な練習により、必ず上達します。頑張ってください！`;

  return {
    correctTranslation,
    feedback,
    rating,
    improvements: [
      "より自然な英語表現を心がけましょう",
      "基本的な文法パターンを復習してみてください"
    ],
    explanation,
    similarPhrases: [
      "Please consider using more natural phrasing.",
      "Try expressing this idea differently."
    ],
  };
}

// ============================================================================
// Stripe関連
// ============================================================================

export const handleGetStripePrices: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const prices = await stripe.prices.list({ limit: 50 });

    const formattedPrices = prices.data.map((price) => ({
      id: price.id,
      product: price.product,
      active: price.active,
      currency: price.currency,
      unit_amount: price.unit_amount,
      recurring: price.recurring,
      type: price.type,
    }));

    res.json({
      account_type: stripeSecretKey.startsWith("sk_test_")
        ? "TEST"
        : stripeSecretKey.startsWith("sk_live_")
          ? "LIVE"
          : "UNKNOWN",
      total_prices: prices.data.length,
      prices: formattedPrices,
    });
  } catch (error) {
    console.error("Error fetching Stripe prices:", error);
    res.status(500).json({
      message: "Stripe価格の取得に失敗しました",
      error: (error as Error).message,
    });
  }
};

export const handleGetSubscriptionPlans: RequestHandler = (
  req: Request,
  res: Response
) => {
  const currentMode = process.env.STRIPE_MODE || "test";
  const currentPrices = priceConfig[currentMode as keyof typeof priceConfig];

  const plans = {
    standard_monthly: {
      priceId: currentPrices.standard_monthly,
      name: "スタンダード月額",
      price: currentMode === "test" ? "¥0/月 (テスト)" : "¥980/月",
      features: ["基本機能", "1日50問まで", "進捗追跡"],
    },
    standard_yearly: {
      priceId: currentPrices.standard_yearly,
      name: "スタンダード年会費",
      price: currentMode === "test" ? "¥0/年 (テスト)" : "¥9,800/年 (2ヶ月分お得)",
      features: ["基本機能", "1日50問まで", "進捗追跡"],
    },
    premium_monthly: {
      priceId: currentPrices.premium_monthly,
      name: "プレミアム月額",
      price: currentMode === "test" ? "¥0/月 (テスト)" : "¥1,300/月",
      features: ["全機能", "1日100問まで", "カスタムシナリオ", "詳細分析"],
    },
    premium_yearly: {
      priceId: currentPrices.premium_yearly,
      name: "プレミアム年会費",
      price: currentMode === "test" ? "¥0/年 (テスト)" : "¥13,000/年 (2ヶ月分お得)",
      features: ["全機能", "1日100問まで", "カスタムシナリオ", "詳細分析"],
    },
    upgrade_to_premium: {
      priceId: process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf",
      name: "プレミアムアップグレード",
      price: "¥2,000/月 (差額)",
      features: ["スタンダードからプレミアムへのアップグレード"],
    },
  };

  res.json(plans);
};

export const handleStripePriceInfo: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { priceId } = req.body;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const price = await stripe.prices.retrieve(priceId);

    res.json({
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      type: price.type,
      product: price.product,
      active: price.active,
      recurring: price.recurring,
    });
  } catch (error) {
    console.error("Price info error:", error);
    res.status(400).json({
      message: (error as Error).message || "価格情報の取得に失敗しました",
    });
  }
};

export const handleSavePriceConfiguration: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { priceIds } = req.body;

    if (!priceIds || typeof priceIds !== "object") {
      return res.status(400).json({ message: "価格ID情報が不正です" });
    }

    if (priceIds.mode) {
      process.env.STRIPE_MODE = priceIds.mode;
      console.log(`Switched to ${priceIds.mode} mode`);
    }

    // 価格IDの更新
    if (priceIds.standard_monthly) {
      process.env.STRIPE_PRICE_STANDARD_MONTHLY = priceIds.standard_monthly;
      priceConfig.production.standard_monthly = priceIds.standard_monthly;
    }
    if (priceIds.standard_yearly) {
      process.env.STRIPE_PRICE_STANDARD_YEARLY = priceIds.standard_yearly;
      priceConfig.production.standard_yearly = priceIds.standard_yearly;
    }
    if (priceIds.premium_monthly) {
      process.env.STRIPE_PRICE_PREMIUM_MONTHLY = priceIds.premium_monthly;
      priceConfig.production.premium_monthly = priceIds.premium_monthly;
    }
    if (priceIds.premium_yearly) {
      process.env.STRIPE_PRICE_PREMIUM_YEARLY = priceIds.premium_yearly;
      priceConfig.production.premium_yearly = priceIds.premium_yearly;
    }

    res.json({
      message: "価格ID設定が保存されました",
      updatedPrices: priceIds,
      currentMode: process.env.STRIPE_MODE || "test",
    });
  } catch (error) {
    console.error("Error saving price configuration:", error);
    res.status(500).json({ message: "価格ID設定の保存に失敗しました" });
  }
};

export const handleCreateCheckoutSession: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    // リクエストデータの検証
    const parseResult = createCheckoutSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.error('Checkout session validation failed:', parseResult.error);
      return res.status(400).json({
        message: "Invalid request data",
        error: parseResult.error.issues,
      });
    }

    const { priceId, successUrl, cancelUrl } = parseResult.data;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("Stripe not configured");
      return res.status(500).json({ 
        message: "決済システムが設定されていません" 
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    // 価格IDの検証
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log("Price validated:", price.id, "Amount:", price.unit_amount, "Currency:", price.currency);
    } catch (priceError) {
      console.error("Price validation failed:", priceError);
      return res.status(400).json({
        message: `価格ID "${priceId}" が見つかりません。Stripeダッシュボードで正しい価格IDを確認してください。`,
        details: (priceError as Error).message,
      });
    }

    // チェックアウトセッションの作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        successUrl ||
        `${req.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.get("origin")}/payment-cancelled`,
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 7 },
      metadata: {
        userId: "default_user",
        planType: getPlanTypeFromPriceId(priceId),
      },
    });

    if (!session.url) {
      console.error("Stripe session creation failed - no URL returned");
      return res.status(500).json({
        message: "決済セッションの作成に失敗しました - URLが取得できませんでした"
      });
    }

    const response: CheckoutSessionResponse = {
      url: session.url,
      sessionId: session.id,
    };

    console.log("Checkout session created successfully:", session.id);
    return res.json(response);

  } catch (error) {
    console.error("Stripe checkout session creation error:", error);
    return res.status(500).json({ 
      message: "決済セッションの作成に失敗しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// セッション管理
// ============================================================================

export const handleGetSessions: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const sessions = await storage.getTrainingSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "履歴の取得に失敗しました" });
  }
};

export const handleGetSessionsByDifficulty: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { difficulty } = req.params;
    const sessions = await storage.getSessionsByDifficulty(difficulty);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "履歴の取得に失敗しました" });
  }
};

// ============================================================================
// プログレス・統計
// ============================================================================

export const handleGetUserGoals: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const goals = await storage.getUserGoals();
    res.json(goals || { dailyGoal: 30, monthlyGoal: 900 });
  } catch (error) {
    console.error("User goals error:", error);
    res.status(500).json({ message: "目標の取得に失敗しました" });
  }
};

export const handleUpdateUserGoals: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { dailyGoal, monthlyGoal } = req.body;
    const goals = await storage.updateUserGoals({ dailyGoal, monthlyGoal });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: "目標の更新に失敗しました" });
  }
};

export const handleGetProgress: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { period = "week" } = req.query as { period?: string };
    const endDate = new Date();
    const startDate = new Date();

    if (period === "week") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(endDate.getMonth() - 1);
    } else {
      startDate.setDate(endDate.getDate() - 1);
    }

    const progress = await storage.getProgressHistory(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "進捗データの取得に失敗しました" });
  }
};

export const handleGetStreak: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const streak = await storage.getStreakCount();
    res.json({ streak });
  } catch (error) {
    res.status(500).json({ message: "連続学習日数の取得に失敗しました" });
  }
};

export const handleGetDifficultyStats: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const stats = await storage.getDifficultyStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "レベル別統計の取得に失敗しました" });
  }
};

export const handleGetMonthlyStats: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const stats = await storage.getMonthlyStats(year, month);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "月間統計の取得に失敗しました" });
  }
};

// ============================================================================
// 復習・ブックマーク
// ============================================================================

export const handleGetReviewSessions: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 2;
    const sessions = await storage.getSessionsForReview(threshold);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "復習セッションの取得に失敗しました" });
  }
};

export const handleGetRecentSessions: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const daysBack = parseInt(req.query.days as string) || 7;
    const sessions = await storage.getRecentSessions(daysBack);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "直近の練習履歴の取得に失敗しました" });
  }
};

export const handleGetBookmarkedSessions: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const sessions = await storage.getBookmarkedSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "ブックマークの取得に失敗しました" });
  }
};

export const handleUpdateBookmark: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { isBookmarked } = req.body;
    await storage.updateBookmark(sessionId, isBookmarked);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "ブックマークの更新に失敗しました" });
  }
};

export const handleUpdateReviewCount: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const sessionId = parseInt(req.params.id);
    await storage.updateReviewCount(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "復習カウントの更新に失敗しました" });
  }
};

// ============================================================================
// カスタムシナリオ（プレミアム機能）
// ============================================================================

export const handleGetCustomScenarios: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const scenarios = await storage.getCustomScenarios();
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ message: "カスタムシナリオの取得に失敗しました" });
  }
};

export const handleCreateCustomScenario: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { title, description } = req.body;
    const scenario = await storage.addCustomScenario({ title, description });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ message: "カスタムシナリオの作成に失敗しました" });
  }
};

export const handleUpdateCustomScenario: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description } = req.body;
    const scenario = await storage.updateCustomScenario(id, { title, description });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ message: "カスタムシナリオの更新に失敗しました" });
  }
};

export const handleDeleteCustomScenario: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCustomScenario(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "カスタムシナリオの削除に失敗しました" });
  }
};

export const handleGetCustomScenario: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const scenario = await storage.getCustomScenario(id);
    if (!scenario) {
      return res.status(404).json({ message: "シナリオが見つかりません" });
    }
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ message: "シナリオの取得に失敗しました" });
  }
};

// ============================================================================
// シミュレーション機能（プレミアム）
// ============================================================================

export const handleGetSimulationProblem: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);
    const scenario = await storage.getCustomScenario(scenarioId);

    if (!scenario) {
      return res.status(404).json({ message: "シナリオが見つかりません" });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return res.status(500).json({ message: "Anthropic API key not configured" });
    }

    const prompt = `以下のシミュレーション設定に基づいて、実践的な日本語文を1つ生成してください。

シミュレーション: ${scenario.title}
詳細: ${scenario.description}

以下の形式でJSONで回答してください:
{
  "japaneseSentence": "日本語の文章",
  "context": "具体的なシチュエーションの説明(20文字以内)"
}

実際の場面で使われそうな自然な日本語文を生成してください。`;

    try {
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anthropicApiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          temperature: 0.8,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      const result = JSON.parse(anthropicData.content[0].text);

      const sessionId = `${getSessionId(req)}-simulation-${scenarioId}`;
      const usedProblems = getUsedProblems(sessionId);

      if (usedProblems.has(result.japaneseSentence)) {
        const variationPrompt = `${prompt}\n\n既に使用された問題: ${Array.from(usedProblems).join(", ")}\n\n上記とは異なる新しい問題を生成してください。`;

        try {
          const retryResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${anthropicApiKey}`,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 500,
              temperature: 0.9,
              messages: [{ role: "user", content: variationPrompt }],
            }),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryResult = JSON.parse(retryData.content[0].text);
            markProblemAsUsed(sessionId, retryResult.japaneseSentence);

            return res.json({
              japaneseSentence: retryResult.japaneseSentence,
              context: retryResult.context || scenario.description,
            });
          }
        } catch (retryError) {
          console.log("Retry generation failed, using original");
        }
      }

      markProblemAsUsed(sessionId, result.japaneseSentence);
      res.json({
        japaneseSentence: result.japaneseSentence,
        context: result.context || scenario.description,
      });
    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);
      res.status(500).json({ message: "問題生成に失敗しました" });
    }
  } catch (error) {
    console.error("Simulation problem error:", error);
    res.status(500).json({ message: "問題生成に失敗しました" });
  }
};

export const handleSimulationTranslate: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { scenarioId, japaneseSentence, userTranslation, context } = req.body;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return res.status(500).json({ message: "Anthropic API key not configured" });
    }

    const scenario = await storage.getCustomScenario(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "シナリオが見つかりません" });
    }

    const prompt = `あなたは英語教師です。シミュレーション練習の英訳を評価してください。

シミュレーション設定: ${scenario.title}
詳細: ${scenario.description}
シチュエーション: ${context}
日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

以下の形式でJSONで回答してください:
{
  "correctTranslation": "正しい英訳(そのシチュエーションに最適な表現)",
  "feedback": "具体的なフィードバック(良い点と改善点)",
  "rating": 1から5の評価(1=要改善、5=完璧),
  "improvements": ["改善提案1", "改善提案2"],
  "explanation": "そのシチュエーションでの表現のポイント(日本語で)",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}`;

    try {
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anthropicApiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      const parsedResult = JSON.parse(anthropicData.content[0].text);

      const response = {
        correctTranslation: parsedResult.correctTranslation,
        feedback: parsedResult.feedback,
        rating: Math.max(1, Math.min(5, parsedResult.rating)),
        improvements: parsedResult.improvements || [],
        explanation: parsedResult.explanation || "",
        similarPhrases: parsedResult.similarPhrases || [],
      };

      await storage.addTrainingSession({
        difficultyLevel: `simulation-${scenarioId}`,
        japaneseSentence,
        userTranslation,
        correctTranslation: response.correctTranslation,
        feedback: response.feedback,
        rating: response.rating,
      });

      res.json(response);
    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);
      res.status(500).json({
        message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。",
      });
    }
  } catch (error) {
    console.error("Simulation translation error:", error);
    res.status(500).json({ message: "翻訳評価に失敗しました" });
  }
};

// ============================================================================
// 日次カウント管理
// ============================================================================

export const handleGetDailyCount: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const count = await storage.getTodaysProblemCount();
    res.json({ count, remaining: Math.max(0, 100 - count) });
  } catch (error) {
    console.error("Error getting daily count:", error);
    res.status(500).json({ message: "Failed to get daily count" });
  }
};

export const handleResetDailyCount: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await storage.resetDailyCount();
    res.json({ message: "Daily count reset successfully" });
  } catch (error) {
    console.error("Error resetting daily count:", error);
    res.status(500).json({ message: "Failed to reset daily count" });
  }
};

// ============================================================================
// その他のハンドラー
// ============================================================================

export const handleEmergencyReset: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Emergency password reset requested for:", email);
    const tempPassword =
      "EmergencyPass123!" + Math.random().toString(36).substring(2, 8);

    const resetSolution = {
      email,
      tempPassword,
      message: "Supabaseメール送信の問題により、緊急対応策を提供します",
      solution: "direct_access",
      steps: [
        "1. 以下の情報で新しいアカウントを作成してください",
        "2. 登録後、すぐにパスワードを変更してください",
        "3. 必要に応じて、古いアカウントデータを移行します",
        "4. この一時パスワードは24時間後に無効になります",
      ],
      credentials: { email, temporaryPassword: tempPassword },
      loginUrl: `${req.protocol}://${req.get("host")}/login`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log("Emergency credentials created:", resetSolution);
    res.json({ success: true, solution: resetSolution });
  } catch (error) {
    console.error("Emergency reset error:", error);
    res.status(500).json({ error: "Emergency reset failed" });
  }
};

export const handleCreateSubscription: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId, priceId } = req.body;
    if (!sessionId || !priceId) {
      return res
        .status(400)
        .json({ message: "SessionID and PriceID are required" });
    }

    const planType = getPlanTypeFromPriceId(priceId);
    const userId = "anonymous";

    await storage.updateUserSubscription(userId, {
      subscriptionType: planType,
      subscriptionStatus: "trialing",
      userId,
      stripeCustomerId: `cus_test_${sessionId}`,
      stripeSubscriptionId: `sub_test_${sessionId}`,
      trialStart: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    console.log(`Manual subscription created: ${planType} for session: ${sessionId}`);
    res.json({
      success: true,
      message: "サブスクリプションが作成されました",
      subscriptionType: planType,
      status: "trialing",
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "サブスクリプションの作成に失敗しました" });
  }
};

export const handleCreateCustomerPortal: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const customerId = "cus_example123";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.get("origin")}/my-page?tab=account`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Customer Portal error:", error);
    res.status(500).json({ message: "カスタマーポータルの作成に失敗しました" });
  }
};

export const handleGetSubscriptionDetails: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = "default_user";
    const subscription = await storage.getUserSubscription(userId);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 5);

    const subscriptionDetails = {
      ...subscription,
      isTrialActive: true,
      trialDaysRemaining: 5,
      trialEndDate: trialEndDate.toISOString(),
      nextBillingDate: "2025-07-27",
      currentPeriodStart: "2025-06-27",
      currentPeriodEnd: "2025-07-27",
      planType: subscription.subscriptionType === "premium" ? "monthly" : "monthly",
      amount: subscription.subscriptionType === "premium" ? 3980 : 1980,
    };

    res.json(subscriptionDetails);
  } catch (error) {
    console.error("Get subscription details error:", error);
    res
      .status(500)
      .json({ message: "サブスクリプション詳細の取得に失敗しました" });
  }
};

export const handleUpgradeSubscription: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { planType } = req.body;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const subscription = await storage.getUserSubscription();
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ message: "アクティブなサブスクリプションが見つかりません" });
    }

    const premiumPriceIds = {
      monthly: "price_1ReXP9Hridtc6DvMpgawL58K",
      yearly: "price_1ReXPnHridtc6DvMQaW7NC6w",
    };

    const targetPriceId = premiumPriceIds[planType as keyof typeof premiumPriceIds];
    if (!targetPriceId) {
      return res.status(400).json({ message: "無効なプランタイプです" });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    if (!stripeSubscription.items.data[0]) {
      return res
        .status(400)
        .json({ message: "サブスクリプションアイテムが見つかりません" });
    }

    const subscriptionItemId = stripeSubscription.items.data[0].id;
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{ id: subscriptionItemId, price: targetPriceId }],
        proration_behavior: "create_prorations",
      },
    );

    await storage.updateUserSubscription(subscription.userId, {
      subscriptionType: "premium",
      stripeSubscriptionItemId: subscriptionItemId,
      planName: planType === "monthly" ? "premium_monthly" : "premium_yearly",
    });

    res.json({
      success: true,
      message: `プレミアム${planType === "monthly" ? "月額" : "年間"}プランにアップグレードしました(日割り計算適用)`,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    res.status(500).json({ message: "アップグレードに失敗しました" });
  }
};

export const handleResetUserData: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await storage.resetUserData();
    res.json({ success: true, message: "ユーザーデータをリセットしました" });
  } catch (error) {
    console.error("Reset user data error:", error);
    res.status(500).json({ message: "データのリセットに失敗しました" });
  }
};

// ============================================================================
// 管理者機能
// ============================================================================

export const handleGetAdminStats: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userSubscription = await storage.getUserSubscription();
    if (!userSubscription?.isAdmin) {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }

    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "統計データの取得に失敗しました" });
  }
};

export const handleGetAdminUsers: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userSubscription = await storage.getUserSubscription();
    if (!userSubscription?.isAdmin) {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }

    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "ユーザーデータの取得に失敗しました" });
  }
};

export const handleGetAdminAnalytics: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userSubscription = await storage.getUserSubscription();
    if (!userSubscription?.isAdmin) {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }

    const analytics = await storage.getLearningAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "分析データの取得に失敗しました" });
  }
};

export const handleAdminExport: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userSubscription = await storage.getUserSubscription();
    if (!userSubscription?.isAdmin) {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }

    const { type } = req.params;
    const csvData = await storage.exportData(type);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}-export.csv"`,
    );
    res.send(csvData);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "データのエクスポートに失敗しました" });
  }
};

export const handleUpdateUserSubscription: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userSubscription = await storage.getUserSubscription();
    if (!userSubscription?.isAdmin) {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }

    const { userId } = req.params;
    const { subscriptionType } = req.body;

    if (!subscriptionType || !["standard", "premium"].includes(subscriptionType)) {
      return res.status(400).json({
        message: "有効なサブスクリプションタイプを指定してください",
      });
    }

    const updatedSubscription = await storage.updateUserSubscription(userId, {
      subscriptionType,
    });
    res.json(updatedSubscription);
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ message: "サブスクリプションの更新に失敗しました" });
  }
};

// ============================================================================
// Webhook処理（別ファイル用）
// ============================================================================

export const handleStripeWebhook: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers["stripe-signature"];
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return res.status(400).send(`Webhook Error: Missing Stripe configuration`);
  }

  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing or invalid Stripe signature header");
  }

  if (!webhookSecret) {
    console.log("Webhook secret not configured, processing without verification");
    try {
      const event = JSON.parse(req.body as string);
      await processWebhookEvent(event);
      return res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook without verification:", error);
      return res.status(400).send("Invalid webhook payload");
    }
  }

  const stripe = new Stripe(stripeSecretKey);
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log(`Webhook signature verification failed.`, errorMessage);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  await processWebhookEvent(event);
  res.json({ received: true });
};

async function processWebhookEvent(event: any) {
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const planType = getPlanTypeFromPriceId(
        session.line_items?.data[0]?.price?.id || "",
      );
      try {
        const userId = session.metadata?.userId || "anonymous";
        await storage.updateUserSubscription(userId, {
          subscriptionType: planType,
          subscriptionStatus: "trialing",
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          trialStart: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        console.log(`User subscription updated to ${planType} for session: ${session.id}`);
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
      break;
    case "customer.subscription.deleted":
      try {
        await storage.updateUserSubscription("anonymous", {
          subscriptionType: "standard",
          subscriptionStatus: "inactive",
        });
        console.log(`User subscription cancelled`);
      } catch (error) {
        console.error("Error cancelling subscription:", error);
      }
      break;
    case "invoice.payment_succeeded":
      try {
        await storage.updateUserSubscription("anonymous", {
          subscriptionStatus: "active",
        });
        console.log(`User subscription activated after payment`);
      } catch (error) {
        console.error("Error activating subscription:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}