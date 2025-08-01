import { Router } from "express";
import { storage } from "./storage";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { translateRequestSchema, problemRequestSchema, createCheckoutSessionSchema, } from "@shared/schema";
import stripeWebhookRouter from "./routes/stripe-webhook";
// Session-based problem tracking to prevent duplicates
const sessionProblems = new Map();
function getSessionId(req) {
    return req.sessionID || req.ip || "default";
}
function getUsedProblems(sessionId) {
    if (!sessionProblems.has(sessionId)) {
        sessionProblems.set(sessionId, new Set());
    }
    return sessionProblems.get(sessionId);
}
function markProblemAsUsed(sessionId, problem) {
    const usedProblems = getUsedProblems(sessionId);
    usedProblems.add(problem);
}
function getUnusedProblem(sessionId, problems) {
    const usedProblems = getUsedProblems(sessionId);
    const availableProblems = problems.filter((p) => !usedProblems.has(p));
    if (availableProblems.length === 0) {
        sessionProblems.delete(sessionId);
        return problems[Math.floor(Math.random() * problems.length)];
    }
    return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}
const router = Router();
// Webhook route
router.use("/webhook", stripeWebhookRouter);
// Health check
router.get("/health", (req, res) => {
    res.status(200).send("OK");
});
// Ping endpoint
router.get("/ping", (req, res) => {
    res.send("pong");
});
// Echo endpoint
router.post("/echo", (req, res) => {
    const sessionId = getSessionId(req);
    res.json({ sessionId, data: req.body });
});
// Authentication middleware
const requireActiveSubscription = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = "bizmowa.com";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            try {
                const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
                if (payload.email) {
                    userId = payload.email;
                }
            }
            catch (jwtError) {
                console.log("JWT parsing failed, using fallback:", jwtError);
                const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                if (userEmail) {
                    userId = userEmail;
                }
            }
        }
        console.log("Checking subscription for user:", userId);
        const subscription = await storage.getUserSubscription(userId);
        if (!subscription ||
            !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
            console.log("No valid subscription found for user:", userId);
            return res.status(403).json({
                message: "アクティブなサブスクリプションが必要です",
                needsSubscription: true,
            });
        }
        console.log("Valid subscription found:", subscription);
        next();
    }
    catch (error) {
        console.error("Subscription check error:", error);
        res
            .status(500)
            .json({ message: "サブスクリプション確認中にエラーが発生しました" });
    }
};
const requirePremiumSubscription = async (req, res, next) => {
    try {
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        let userId = "bizmowa.com";
        if (userEmail) {
            userId = userEmail;
        }
        console.log("Checking premium subscription for user:", userId);
        const subscription = await storage.getUserSubscription(userId);
        if (!subscription ||
            subscription.subscriptionType !== "premium" ||
            !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
            console.log("No valid premium subscription found for user:", userId);
            return res.status(403).json({
                message: "プレミアムプランが必要です",
                needsPremium: true,
            });
        }
        console.log("Valid premium subscription found:", subscription);
        next();
    }
    catch (error) {
        console.error("Premium subscription check error:", error);
        res
            .status(500)
            .json({ message: "プレミアムサブスクリプションの確認に失敗しました" });
    }
};
// Authentication endpoints
router.post("/auth/signup", async (req, res) => {
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
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(400).json({ message: "アカウント作成に失敗しました" });
    }
});
router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const subscription = await storage.getUserSubscription();
        const needsSubscription = !subscription ||
            !["active", "trialing"].includes(subscription.subscriptionStatus || "");
        res.json({
            success: true,
            message: "ログインしました",
            needsSubscription,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(400).json({ message: "ログインに失敗しました" });
    }
});
// Get user subscription information
router.get("/user-subscription", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = "bizmowa.com";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            try {
                const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
                if (payload.email) {
                    userId = payload.email;
                }
            }
            catch (jwtError) {
                console.log("JWT parsing failed, using fallback:", jwtError);
                const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                if (userEmail) {
                    userId = userEmail;
                }
            }
        }
        console.log("Getting subscription for user:", userId);
        const subscription = await storage.getUserSubscription(userId);
        if (!subscription) {
            // Create a default subscription for new users
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
        res.json(subscription);
    }
    catch (error) {
        console.error("User subscription error:", error);
        res.status(500).json({
            message: "サブスクリプション情報の取得に失敗しました",
            error: error.message
        });
    }
});
// Generate Japanese problem for translation
router.post("/problem", requireActiveSubscription, async (req, res) => {
    try {
        const canProceed = await storage.incrementDailyCount();
        if (!canProceed) {
            return res.status(429).json({
                message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
                dailyLimitReached: true,
            });
        }
        const { difficultyLevel } = problemRequestSchema.parse(req.body);
        const userId = "bizmowa.com";
        const previousProblems = await storage.getUserAttemptedProblems(difficultyLevel, userId);
        const attemptedSentences = new Set(previousProblems.map((p) => p.japaneseSentence));
        const problemSets = {
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
                "明日友達と会う予定です。",
                "昨日は図書館で勉強しました。",
                "母は美味しい夕食を作ってくれます。",
                "兄は野球が上手です。",
                "私は数学が好きです。",
                "先生はとても親切です。",
                "夏休みに海に行きました。",
                "犬と散歩をしています。",
                "友達と公園で遊びました。",
                "宿題を忘れてしまいました。",
                "電車で学校に通っています。",
            ],
            "high-school": [
                "環境問題について考えることは重要です。",
                "技術の進歩により、私たちの生活は便利になりました。",
                "彼は将来医者になりたいと言っています。",
                "この本を読み終えたら、感想を教えてください。",
                "もし時間があれば、一緒に旅行に行きませんか。",
                "科学技術の発展は社会に大きな影響を与えています。",
                "国際化が進む中で、英語の重要性が高まっています。",
                "地球温暖化は深刻な問題となっています。",
                "教育制度の改革が議論されています。",
                "多様性を認め合うことが大切です。",
                "持続可能な社会を目指すべきです。",
                "文化の違いを理解することは重要です。",
                "創造性を育むことが求められています。",
                "情報社会における課題は多岐にわたります。",
                "若者の価値観は変化しています。",
            ],
            "basic-verbs": [
                "彼は毎朝コーヒーを作ります。",
                "子供たちが公園で遊んでいます。",
                "母は料理を作っています。",
                "私は友達に手紙を書きました。",
                "電車が駅に到着しました。",
                "猫が魚を食べています。",
                "父は新聞を読んでいます。",
                "私は音楽を聞いています。",
                "彼女は花を植えました。",
                "鳥が空を飛んでいます。",
                "学生が勉強しています。",
                "医者が患者を診察します。",
                "雨が降り始めました。",
                "太陽が昇っています。",
                "風が強く吹いています。",
            ],
            "business-email": [
                "お世話になっております。",
                "会議の件でご連絡いたします。",
                "添付ファイルをご査収ください。",
                "明日の会議の件でリスケジュールをお願いしたく存じます。",
                "資料の修正版を添付いたします。",
                "ご確認のほど、よろしくお願いいたします。",
                "誠に申し訳ございませんが、添付ファイルに不備がございました。",
                "お忙しいところ恐縮ですが、ご返信をお待ちしております。",
                "来週の打ち合わせの日程調整をさせていただきたく存じます。",
                "議事録を共有いたします。",
                "Teamsのリンクを共有いたします。",
                "恐れ入りますが、期日の延期をお願いできますでしょうか。",
                "進捗状況についてご報告いたします。",
                "お手数ですが、ご確認いただけますでしょうか。",
                "ご指摘いただいた点について修正いたします。",
                "見積書を送付いたします。",
                "契約書の件でご相談があります。",
                "担当者変更のご案内をいたします。",
                "今月末までにご提出をお願いいたします。",
                "CCで関係者の皆様にも共有いたします。",
                "お疲れ様でした。本日はありがとうございました。",
                "至急ご対応いただけますでしょうか。",
                "念のため、再度ご連絡いたします。",
                "ご都合の良い日時をお教えください。",
                "引き続きよろしくお願いいたします。",
            ],
        };
        const allSentences = problemSets[difficultyLevel];
        const availableSentences = allSentences.filter((sentence) => !attemptedSentences.has(sentence));
        const sentences = availableSentences.length > 0 ? availableSentences : allSentences;
        const sessionId = getSessionId(req);
        const selectedSentence = getUnusedProblem(sessionId, sentences);
        if (!selectedSentence) {
            return res.status(500).json({ message: "No problems available" });
        }
        markProblemAsUsed(sessionId, selectedSentence);
        const response = {
            japaneseSentence: selectedSentence,
            hints: [
                `問題${await storage.getCurrentProblemNumber(userId, difficultyLevel)}`,
            ],
        };
        res.json(response);
    }
    catch (error) {
        res.status(400).json({ message: "Invalid request data" });
    }
});
// Evaluate user translation using Claude Haiku
router.post("/translate", async (req, res) => {
    try {
        const { japaneseSentence, userTranslation, difficultyLevel } = translateRequestSchema.parse(req.body);
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            return res
                .status(500)
                .json({ message: "Anthropic API key not configured" });
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
            }
            catch (parseError) {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedResult = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error("No valid JSON found in Claude response");
                }
            }
            const response = {
                correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
                feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
                rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
                improvements: parsedResult.improvements || [],
                explanation: parsedResult.explanation || "",
                similarPhrases: parsedResult.similarPhrases || [],
            };
            const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
            const userId = userEmail || "bizmowa.com";
            const trainingSession = await storage.addTrainingSession({
                userId,
                difficultyLevel,
                japaneseSentence,
                userTranslation,
                correctTranslation: response.correctTranslation,
                feedback: response.feedback,
                rating: response.rating,
            });
            const currentProblemNumber = await storage.getCurrentProblemNumber(userId, difficultyLevel);
            await storage.updateProblemProgress(userId, difficultyLevel, currentProblemNumber + 1);
            res.json({ ...response, sessionId: trainingSession.id });
        }
        catch (sdkError) {
            console.error("Anthropic SDK error:", sdkError);
            try {
                const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "x-api-key": anthropicApiKey,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01",
                    },
                    body: JSON.stringify({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1000,
                        temperature: 0.7,
                        system: systemPrompt,
                        messages: [{ role: "user", content: userPrompt }],
                    }),
                });
                if (!anthropicResponse.ok) {
                    throw new Error(`Direct API error: ${anthropicResponse.status}`);
                }
                const anthropicData = await anthropicResponse.json();
                const content = anthropicData.content[0].text;
                let parsedResult;
                try {
                    parsedResult = JSON.parse(content);
                }
                catch (parseError) {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsedResult = JSON.parse(jsonMatch[0]);
                    }
                    else {
                        throw new Error("No valid JSON found in direct API response");
                    }
                }
                const response = {
                    correctTranslation: parsedResult.correctTranslation || "Direct API translation failed",
                    feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
                    rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
                    improvements: parsedResult.improvements || [],
                    explanation: parsedResult.explanation || "",
                    similarPhrases: parsedResult.similarPhrases || [],
                };
                const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                const userId = userEmail || "bizmowa.com";
                const trainingSession = await storage.addTrainingSession({
                    userId,
                    difficultyLevel,
                    japaneseSentence,
                    userTranslation,
                    correctTranslation: response.correctTranslation,
                    feedback: response.feedback,
                    rating: response.rating,
                });
                const currentProblemNumber = await storage.getCurrentProblemNumber(userId, difficultyLevel);
                await storage.updateProblemProgress(userId, difficultyLevel, currentProblemNumber + 1);
                res.json({ ...response, sessionId: trainingSession.id });
            }
            catch (directApiError) {
                console.error("Direct API error:", directApiError);
                const basicResponse = {
                    correctTranslation: `Please try again. The system is currently experiencing issues.`,
                    feedback: `申し訳ございません。現在AI評価システムに一時的な問題が発生しています。お答えいただいた「${userTranslation}」については、システム復旧後に再度評価いたします。`,
                    rating: 3,
                    improvements: [
                        "システム復旧をお待ちください",
                        "しばらくしてからもう一度お試しください",
                    ],
                    explanation: "システムメンテナンス中のため、詳細な評価ができません。ご不便をおかけして申し訳ございません。",
                    similarPhrases: [
                        "Please wait for system recovery.",
                        "System maintenance in progress.",
                    ],
                };
                res.json({ ...basicResponse, sessionId: 0 });
            }
        }
    }
    catch (error) {
        console.error("Translation error:", error);
        res.status(400).json({ message: "Invalid request data" });
    }
});
// Get available Stripe prices
router.get("/stripe-prices", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching Stripe prices:", error);
        res.status(500).json({
            message: "Stripe価格の取得に失敗しました",
            error: error.message,
        });
    }
});
// Price configuration
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
router.get("/subscription-plans", (req, res) => {
    const currentMode = process.env.STRIPE_MODE || "test";
    const currentPrices = priceConfig[currentMode];
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
});
router.post("/stripe/price-info", async (req, res) => {
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
    }
    catch (error) {
        console.error("Price info error:", error);
        res.status(400).json({
            message: error.message || "価格情報の取得に失敗しました",
        });
    }
});
router.post("/save-price-configuration", async (req, res) => {
    try {
        const { priceIds } = req.body;
        if (!priceIds || typeof priceIds !== "object") {
            return res.status(400).json({ message: "価格ID情報が不正です" });
        }
        if (priceIds.mode) {
            process.env.STRIPE_MODE = priceIds.mode;
            console.log(`Switched to ${priceIds.mode} mode`);
        }
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
    }
    catch (error) {
        console.error("Error saving price configuration:", error);
        res.status(500).json({ message: "価格ID設定の保存に失敗しました" });
    }
});
router.post("/plan-configuration", async (req, res) => {
    try {
        const { plans } = req.body;
        const configData = {
            updated_at: new Date().toISOString(),
            plans,
        };
        console.log("Plan configuration updated:", configData);
        res.json({
            success: true,
            message: "プラン設定が正常に更新されました",
            updated_count: Object.keys(plans).length,
        });
    }
    catch (error) {
        console.error("Plan configuration error:", error);
        res.status(400).json({
            message: error.message || "プラン設定の更新に失敗しました",
        });
    }
});
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { priceId, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(req.body);
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return res.status(500).json({ message: "Stripe not configured" });
        }
        const stripe = new Stripe(stripeSecretKey);
        try {
            const price = await stripe.prices.retrieve(priceId);
            console.log("Price found:", price.id, "Amount:", price.unit_amount, "Currency:", price.currency);
        }
        catch (priceError) {
            console.error("Price not found:", priceError);
            return res.status(400).json({
                message: `価格ID "${priceId}" が見つかりません。Stripeダッシュボードで正しい価格IDを確認してください。`,
                details: priceError.message,
            });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl ||
                `${req.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.get("origin")}/payment-cancelled`,
            allow_promotion_codes: true,
            subscription_data: { trial_period_days: 7 },
            metadata: {
                userId: "default_user",
                planType: getPlanTypeFromPriceId(priceId),
            },
        });
        const response = {
            url: session.url ?? "",
            sessionId: session.id,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ message: "決済セッションの作成に失敗しました" });
    }
});
router.get("/stripe-prices", async (req, res) => {
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return res.status(500).json({ message: "Stripe not configured" });
        }
        const stripe = new Stripe(stripeSecretKey);
        const prices = await stripe.prices.list({ active: true, limit: 100 });
        const account = await stripe.accounts.retrieve();
        res.json({
            account_type: account.type,
            total_prices: prices.data.length,
            prices: prices.data.map((price) => ({
                id: price.id,
                active: price.active,
                currency: price.currency,
                unit_amount: price.unit_amount,
                type: price.type,
                recurring: price.recurring,
                product: price.product,
            })),
        });
    }
    catch (error) {
        console.error("Stripe prices error:", error);
        res.status(500).json({ message: "価格情報の取得に失敗しました" });
    }
});
router.post("/emergency-reset", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        console.log("Emergency password reset requested for:", email);
        const tempPassword = "EmergencyPass123!" + Math.random().toString(36).substring(2, 8);
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
    }
    catch (error) {
        console.error("Emergency reset error:", error);
        res.status(500).json({ error: "Emergency reset failed" });
    }
});
router.post("/create-subscription", async (req, res) => {
    try {
        const { sessionId, priceId } = req.body;
        if (!sessionId || !priceId) {
            return res
                .status(400)
                .json({ message: "SessionID and PriceID are required" });
        }
        const planType = getPlanTypeFromPriceId(priceId);
        const userId = "bizmowa.com";
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
    }
    catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: "サブスクリプションの作成に失敗しました" });
    }
});
router.post("/create-customer-portal", async (req, res) => {
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
    }
    catch (error) {
        console.error("Stripe Customer Portal error:", error);
        res.status(500).json({ message: "カスタマーポータルの作成に失敗しました" });
    }
});
router.get("/subscription-details", async (req, res) => {
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
    }
    catch (error) {
        console.error("Get subscription details error:", error);
        res
            .status(500)
            .json({ message: "サブスクリプション詳細の取得に失敗しました" });
    }
});
router.post("/stripe-webhook", async (req, res) => {
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
            const event = JSON.parse(req.body);
            await processWebhookEvent(event);
            return res.json({ received: true });
        }
        catch (error) {
            console.error("Error processing webhook without verification:", error);
            return res.status(400).send("Invalid webhook payload");
        }
    }
    const stripe = new Stripe(stripeSecretKey);
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.log(`Webhook signature verification failed.`, errorMessage);
        return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }
    await processWebhookEvent(event);
    res.json({ received: true });
});
async function processWebhookEvent(event) {
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            const planType = getPlanTypeFromPriceId(session.line_items?.data[0]?.price?.id || "");
            try {
                const userId = session.metadata?.userId || "bizmowa.com";
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
            }
            catch (error) {
                console.error("Error updating subscription:", error);
            }
            break;
        case "customer.subscription.deleted":
            try {
                await storage.updateUserSubscription("bizmowa.com", {
                    subscriptionType: "standard",
                    subscriptionStatus: "inactive",
                });
                console.log(`User subscription cancelled`);
            }
            catch (error) {
                console.error("Error cancelling subscription:", error);
            }
            break;
        case "invoice.payment_succeeded":
            try {
                await storage.updateUserSubscription("bizmowa.com", {
                    subscriptionStatus: "active",
                });
                console.log(`User subscription activated after payment`);
            }
            catch (error) {
                console.error("Error activating subscription:", error);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}
function getPlanTypeFromPriceId(priceId) {
    const currentMode = process.env.STRIPE_MODE || "test";
    const currentPrices = priceConfig[currentMode];
    if (priceId === currentPrices.standard_monthly ||
        priceId === currentPrices.standard_yearly) {
        return "standard";
    }
    else if (priceId === currentPrices.premium_monthly ||
        priceId === currentPrices.premium_yearly ||
        priceId ===
            (process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf")) {
        return "premium";
    }
    return "standard";
}
// Get training history
router.get("/sessions", async (req, res) => {
    try {
        const sessions = await storage.getTrainingSessions();
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
});
// Get sessions by difficulty
router.get("/sessions/:difficulty", async (req, res) => {
    try {
        const { difficulty } = req.params;
        const sessions = await storage.getSessionsByDifficulty(difficulty);
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
});
// My Page APIs
router.get("/user-goals", async (req, res) => {
    try {
        const goals = await storage.getUserGoals();
        res.json(goals || { dailyGoal: 30, monthlyGoal: 900 });
    }
    catch (error) {
        console.error("User goals error:", error);
        res.status(500).json({ message: "目標の取得に失敗しました" });
    }
});
router.post("/user-goals", async (req, res) => {
    try {
        const { dailyGoal, monthlyGoal } = req.body;
        const goals = await storage.updateUserGoals({ dailyGoal, monthlyGoal });
        res.json(goals);
    }
    catch (error) {
        res.status(500).json({ message: "目標の更新に失敗しました" });
    }
});
router.get("/progress", async (req, res) => {
    try {
        const { period = "week" } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        if (period === "week") {
            startDate.setDate(endDate.getDate() - 7);
        }
        else if (period === "month") {
            startDate.setMonth(endDate.getMonth() - 1);
        }
        else {
            startDate.setDate(endDate.getDate() - 1);
        }
        const progress = await storage.getProgressHistory(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);
        res.json(progress);
    }
    catch (error) {
        res.status(500).json({ message: "進捗データの取得に失敗しました" });
    }
});
router.get("/streak", async (req, res) => {
    try {
        const streak = await storage.getStreakCount();
        res.json({ streak });
    }
    catch (error) {
        res.status(500).json({ message: "連続学習日数の取得に失敗しました" });
    }
});
router.get("/difficulty-stats", async (req, res) => {
    try {
        const stats = await storage.getDifficultyStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: "レベル別統計の取得に失敗しました" });
    }
});
router.get("/monthly-stats", async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const stats = await storage.getMonthlyStats(year, month);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: "月間統計の取得に失敗しました" });
    }
});
router.get("/review-sessions", async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 2;
        const sessions = await storage.getSessionsForReview(threshold);
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: "復習セッションの取得に失敗しました" });
    }
});
router.get("/recent-sessions", async (req, res) => {
    try {
        const daysBack = parseInt(req.query.days) || 7;
        const sessions = await storage.getRecentSessions(daysBack);
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: "直近の練習履歴の取得に失敗しました" });
    }
});
router.get("/bookmarked-sessions", async (req, res) => {
    try {
        const sessions = await storage.getBookmarkedSessions();
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: "ブックマークの取得に失敗しました" });
    }
});
router.post("/sessions/:id/bookmark", async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { isBookmarked } = req.body;
        await storage.updateBookmark(sessionId, isBookmarked);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: "ブックマークの更新に失敗しました" });
    }
});
router.post("/sessions/:id/review", async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        await storage.updateReviewCount(sessionId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: "復習カウントの更新に失敗しました" });
    }
});
router.get("/custom-scenarios", async (req, res) => {
    try {
        const scenarios = await storage.getCustomScenarios();
        res.json(scenarios);
    }
    catch (error) {
        res.status(500).json({ message: "カスタムシナリオの取得に失敗しました" });
    }
});
router.post("/custom-scenarios", requirePremiumSubscription, async (req, res) => {
    try {
        const { title, description } = req.body;
        const scenario = await storage.addCustomScenario({ title, description });
        res.json(scenario);
    }
    catch (error) {
        res.status(500).json({ message: "カスタムシナリオの作成に失敗しました" });
    }
});
router.put("/custom-scenarios/:id", requirePremiumSubscription, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description } = req.body;
        const scenario = await storage.updateCustomScenario(id, {
            title,
            description,
        });
        res.json(scenario);
    }
    catch (error) {
        res.status(500).json({ message: "カスタムシナリオの更新に失敗しました" });
    }
});
router.delete("/custom-scenarios/:id", requirePremiumSubscription, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await storage.deleteCustomScenario(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: "カスタムシナリオの削除に失敗しました" });
    }
});
router.get("/custom-scenarios/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const scenario = await storage.getCustomScenario(id);
        if (!scenario) {
            return res.status(404).json({ message: "シナリオが見つかりません" });
        }
        res.json(scenario);
    }
    catch (error) {
        res.status(500).json({ message: "シナリオの取得に失敗しました" });
    }
});
router.get("/simulation-problem/:scenarioId", requirePremiumSubscription, async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const scenario = await storage.getCustomScenario(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: "シナリオが見つかりません" });
        }
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            return res
                .status(500)
                .json({ message: "Anthropic API key not configured" });
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
                }
                catch (retryError) {
                    console.log("Retry generation failed, using original");
                }
            }
            markProblemAsUsed(sessionId, result.japaneseSentence);
            res.json({
                japaneseSentence: result.japaneseSentence,
                context: result.context || scenario.description,
            });
        }
        catch (anthropicError) {
            console.error("Anthropic API error:", anthropicError);
            res.status(500).json({ message: "問題生成に失敗しました" });
        }
    }
    catch (error) {
        console.error("Simulation problem error:", error);
        res.status(500).json({ message: "問題生成に失敗しました" });
    }
});
router.post("/simulation-translate", requirePremiumSubscription, async (req, res) => {
    try {
        const { scenarioId, japaneseSentence, userTranslation, context } = req.body;
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            return res
                .status(500)
                .json({ message: "Anthropic API key not configured" });
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
        }
        catch (anthropicError) {
            console.error("Anthropic API error:", anthropicError);
            res.status(500).json({
                message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。",
            });
        }
    }
    catch (error) {
        console.error("Simulation translation error:", error);
        res.status(500).json({ message: "翻訳評価に失敗しました" });
    }
});
router.get("/daily-count", async (req, res) => {
    try {
        const count = await storage.getTodaysProblemCount();
        res.json({ count, remaining: Math.max(0, 100 - count) });
    }
    catch (error) {
        console.error("Error getting daily count:", error);
        res.status(500).json({ message: "Failed to get daily count" });
    }
});
router.post("/reset-daily-count", async (req, res) => {
    try {
        await storage.resetDailyCount();
        res.json({ message: "Daily count reset successfully" });
    }
    catch (error) {
        console.error("Error resetting daily count:", error);
        res.status(500).json({ message: "Failed to reset daily count" });
    }
});
router.get("/user-subscription", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = "bizmowa.com";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            console.log("Auth token received:", token.substring(0, 20) + "...");
            try {
                const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
                if (payload.email) {
                    userId = payload.email;
                    console.log("Extracted user email from JWT:", userId);
                }
            }
            catch (jwtError) {
                console.log("JWT parsing failed, using fallback:", jwtError);
                const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                if (userEmail) {
                    userId = userEmail;
                }
            }
        }
        console.log("Getting subscription for user:", userId);
        const subscription = await storage.getUserSubscription(userId);
        if (!subscription) {
            console.log("No subscription found for user:", userId);
            return res.json(null);
        }
        console.log("Found subscription:", subscription);
        res.json(subscription);
    }
    catch (error) {
        console.error("Subscription error:", error);
        res
            .status(500)
            .json({ message: "サブスクリプション情報の取得に失敗しました" });
    }
});
router.post("/upgrade-subscription", async (req, res) => {
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
        const targetPriceId = premiumPriceIds[planType];
        if (!targetPriceId) {
            return res.status(400).json({ message: "無効なプランタイプです" });
        }
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        if (!stripeSubscription.items.data[0]) {
            return res
                .status(400)
                .json({ message: "サブスクリプションアイテムが見つかりません" });
        }
        const subscriptionItemId = stripeSubscription.items.data[0].id;
        const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{ id: subscriptionItemId, price: targetPriceId }],
            proration_behavior: "create_prorations",
        });
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
    }
    catch (error) {
        console.error("Upgrade subscription error:", error);
        res.status(500).json({ message: "アップグレードに失敗しました" });
    }
});
router.get("/admin/stats", async (req, res) => {
    try {
        const userSubscription = await storage.getUserSubscription();
        if (!userSubscription?.isAdmin) {
            return res.status(403).json({ message: "管理者権限が必要です" });
        }
        const stats = await storage.getAdminStats();
        res.json(stats);
    }
    catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "統計データの取得に失敗しました" });
    }
});
router.get("/admin/users", async (req, res) => {
    try {
        const userSubscription = await storage.getUserSubscription();
        if (!userSubscription?.isAdmin) {
            return res.status(403).json({ message: "管理者権限が必要です" });
        }
        const users = await storage.getAllUsers();
        res.json(users);
    }
    catch (error) {
        console.error("Admin users error:", error);
        res.status(500).json({ message: "ユーザーデータの取得に失敗しました" });
    }
});
router.get("/admin/analytics", async (req, res) => {
    try {
        const userSubscription = await storage.getUserSubscription();
        if (!userSubscription?.isAdmin) {
            return res.status(403).json({ message: "管理者権限が必要です" });
        }
        const analytics = await storage.getLearningAnalytics();
        res.json(analytics);
    }
    catch (error) {
        console.error("Admin analytics error:", error);
        res.status(500).json({ message: "分析データの取得に失敗しました" });
    }
});
router.get("/admin/export/:type", async (req, res) => {
    try {
        const userSubscription = await storage.getUserSubscription();
        if (!userSubscription?.isAdmin) {
            return res.status(403).json({ message: "管理者権限が必要です" });
        }
        const { type } = req.params;
        const csvData = await storage.exportData(type);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${type}-export.csv"`);
        res.send(csvData);
    }
    catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ message: "データのエクスポートに失敗しました" });
    }
});
router.put("/admin/users/:userId/subscription", async (req, res) => {
    try {
        const userSubscription = await storage.getUserSubscription();
        if (!userSubscription?.isAdmin) {
            return res.status(403).json({ message: "管理者権限が必要です" });
        }
        const { userId } = req.params;
        const { subscriptionType } = req.body;
        if (!subscriptionType ||
            !["standard", "premium"].includes(subscriptionType)) {
            return res.status(400).json({
                message: "有効なサブスクリプションタイプを指定してください",
            });
        }
        const updatedSubscription = await storage.updateUserSubscription(userId, {
            subscriptionType,
        });
        res.json(updatedSubscription);
    }
    catch (error) {
        console.error("Update subscription error:", error);
        res
            .status(500)
            .json({ message: "サブスクリプションの更新に失敗しました" });
    }
});
router.post("/reset-user-data", async (req, res) => {
    try {
        await storage.resetUserData();
        res.json({ success: true, message: "ユーザーデータをリセットしました" });
    }
    catch (error) {
        console.error("Reset user data error:", error);
        res.status(500).json({ message: "データのリセットに失敗しました" });
    }
});
export async function registerRoutes(app) {
    // 通常APIルート
    app.use("/api", router);
    // Stripe Webhook
    app.use("/api/stripe-webhook", stripeWebhookRouter);
}
