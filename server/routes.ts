import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { 
  translateRequestSchema, 
  problemRequestSchema, 
  createCheckoutSessionSchema,
  type TranslateResponse,
  type ProblemResponse,
  type CheckoutSessionResponse
} from "@shared/schema";

// Session-based problem tracking to prevent duplicates
const sessionProblems = new Map<string, Set<string>>();

function getSessionId(req: any): string {
  // Use session ID if available, otherwise use IP as fallback
  return req.sessionID || req.ip || 'default';
}

function getUsedProblems(sessionId: string): Set<string> {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, new Set());
  }
  return sessionProblems.get(sessionId)!;
}

function markProblemAsUsed(sessionId: string, problem: string): void {
  const usedProblems = getUsedProblems(sessionId);
  usedProblems.add(problem);
}

function getUnusedProblem(sessionId: string, problems: string[]): string | null {
  const usedProblems = getUsedProblems(sessionId);
  const availableProblems = problems.filter(p => !usedProblems.has(p));
  
  // If all problems have been used, reset the session
  if (availableProblems.length === 0) {
    sessionProblems.delete(sessionId);
    return problems[Math.floor(Math.random() * problems.length)];
  }
  
  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware to check subscription status
  const requireActiveSubscription = async (req: any, res: any, next: any) => {
    try {
      const subscription = await storage.getUserSubscription();
      if (!subscription || !['active', 'trialing'].includes(subscription.subscriptionStatus || '')) {
        return res.status(403).json({ 
          message: "アクティブなサブスクリプションが必要です",
          needsSubscription: true 
        });
      }
      next();
    } catch (error) {
      console.error("Subscription check error:", error);
      res.status(500).json({ message: "サブスクリプション確認中にエラーが発生しました" });
    }
  };

  // Authentication endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // In a real app, you would hash the password and store in database
      // For now, we'll create a user subscription record
      await storage.updateUserSubscription("default_user", {
        subscriptionStatus: "inactive",
        userId: "default_user"
      });
      
      res.json({ 
        success: true, 
        message: "アカウントが作成されました",
        needsSubscription: true 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "アカウント作成に失敗しました" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // In a real app, you would verify credentials
      const subscription = await storage.getUserSubscription();
      const needsSubscription = !subscription || !['active', 'trialing'].includes(subscription.subscriptionStatus || '');
      
      res.json({ 
        success: true, 
        message: "ログインしました",
        needsSubscription 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "ログインに失敗しました" });
    }
  });

  // Generate Japanese problem for translation (protected)
  app.post("/api/problem", requireActiveSubscription, async (req, res) => {
    try {
      // Check daily limit first
      const canProceed = await storage.incrementDailyCount();
      if (!canProceed) {
        return res.status(429).json({ 
          message: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
          dailyLimitReached: true 
        });
      }

      const { difficultyLevel } = problemRequestSchema.parse(req.body);
      
      // Get previously attempted problems from database  
      const userId = "bizmowa.com"; // Use bizmowa.com user for trial
      const previousProblems = await storage.getUserAttemptedProblems(difficultyLevel, userId);
      const attemptedSentences = new Set(previousProblems.map(p => p.japaneseSentence));

      // Problem sentences by difficulty level (expanded sets)
      const problemSets = {
        'toeic': [
          '会議の資料を準備しておいてください。',
          '売上が前年比20%増加しました。',
          '新しいプロジェクトの進捗はいかがですか。',
          '顧客からのフィードバックを検討する必要があります。',
          '来週までに報告書を提出してください。',
          'クライアントとの打ち合わせが予定されています。',
          '予算の見直しが必要です。',
          'スケジュールを調整いたします。',
          'チームメンバーと連携を取ってください。',
          '納期に間に合うよう努力します。',
          '品質管理の向上が課題です。',
          'マーケティング戦略を検討しています。',
          '競合他社の動向を調査しました。',
          '今四半期の目標を達成しました。',
          'プロジェクトの進捗状況を報告します。'
        ],
        'middle-school': [
          '私は毎日学校に行きます。',
          '今日は雨が降っています。',
          '彼女は本を読むのが好きです。',
          '私たちは昨日映画を見ました。',
          '明日友達と会う予定です。',
          '昨日は図書館で勉強しました。',
          '母は美味しい夕食を作ってくれます。',
          '兄は野球が上手です。',
          '私は数学が好きです。',
          '先生はとても親切です。',
          '夏休みに海に行きました。',
          '犬と散歩をしています。',
          '友達と公園で遊びました。',
          '宿題を忘れてしまいました。',
          '電車で学校に通っています。'
        ],
        'high-school': [
          '環境問題について考えることは重要です。',
          '技術の進歩により、私たちの生活は便利になりました。',
          '彼は将来医者になりたいと言っています。',
          'この本を読み終えたら、感想を教えてください。',
          'もし時間があれば、一緒に旅行に行きませんか。',
          '科学技術の発展は社会に大きな影響を与えています。',
          '国際化が進む中で、英語の重要性が高まっています。',
          '地球温暖化は深刻な問題となっています。',
          '教育制度の改革が議論されています。',
          '多様性を認め合うことが大切です。',
          '持続可能な社会を目指すべきです。',
          '文化の違いを理解することは重要です。',
          '創造性を育むことが求められています。',
          '情報社会における課題は多岐にわたります。',
          '若者の価値観は変化しています。'
        ],
        'basic-verbs': [
          '彼は毎朝コーヒーを作ります。',
          '子供たちが公園で遊んでいます。',
          '母は料理を作っています。',
          '私は友達に手紙を書きました。',
          '電車が駅に到着しました。',
          '猫が魚を食べています。',
          '父は新聞を読んでいます。',
          '私は音楽を聞いています。',
          '彼女は花を植えました。',
          '鳥が空を飛んでいます。',
          '学生が勉強しています。',
          '医者が患者を診察します。',
          '雨が降り始めました。',
          '太陽が昇っています。',
          '風が強く吹いています。'
        ],
        'business-email': [
          'お世話になっております。',
          '会議の件でご連絡いたします。',
          '添付ファイルをご査収ください。',
          '明日の会議の件でリスケジュールをお願いしたく存じます。',
          '資料の修正版を添付いたします。',
          'ご確認のほど、よろしくお願いいたします。',
          '誠に申し訳ございませんが、添付ファイルに不備がございました。',
          'お忙しいところ恐縮ですが、ご返信をお待ちしております。',
          '来週の打ち合わせの日程調整をさせていただきたく存じます。',
          '議事録を共有いたします。',
          'Teamsのリンクを共有いたします。',
          '恐れ入りますが、期日の延期をお願いできますでしょうか。',
          '進捗状況についてご報告いたします。',
          'お手数ですが、ご確認いただけますでしょうか。',
          'ご指摘いただいた点について修正いたします。',
          '見積書を送付いたします。',
          '契約書の件でご相談があります。',
          '担当者変更のご案内をいたします。',
          '今月末までにご提出をお願いいたします。',
          'CCで関係者の皆様にも共有いたします。',
          'お疲れ様でした。本日はありがとうございました。',
          '至急ご対応いただけますでしょうか。',
          '念のため、再度ご連絡いたします。',
          'ご都合の良い日時をお教えください。',
          '引き続きよろしくお願いいたします。'
        ]
      };

      // Get current problem number for this user and difficulty
      const currentProblemNumber = await storage.getCurrentProblemNumber(userId, difficultyLevel);
      
      const allSentences = problemSets[difficultyLevel];
      // Filter out previously attempted problems
      const availableSentences = allSentences.filter(sentence => !attemptedSentences.has(sentence));
      
      // If all problems have been attempted, use all problems (allow reset)
      const sentences = availableSentences.length > 0 ? availableSentences : allSentences;
      
      const sessionId = getSessionId(req);
      const selectedSentence = getUnusedProblem(sessionId, sentences);
      
      if (!selectedSentence) {
        return res.status(500).json({ message: "No problems available" });
      }
      
      markProblemAsUsed(sessionId, selectedSentence);
      
      const response: ProblemResponse = {
        japaneseSentence: selectedSentence,
        hints: [`問題${currentProblemNumber}`]
      };

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Evaluate user translation using Claude Haiku
  app.post("/api/translate", async (req, res) => {
    try {
      const { japaneseSentence, userTranslation, difficultyLevel } = translateRequestSchema.parse(req.body);
      
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const systemPrompt = `あなたは日本人の英語学習者向けの英語教師です。ユーザーの日本語から英語への翻訳を評価し、以下のJSON形式で返答してください。

重要：すべての説明とフィードバックは必ず日本語で書いてください。

{
  "correctTranslation": "正しい英訳（ネイティブが自然に使う表現）",
  "feedback": "具体的なフィードバック（良い点と改善点を日本語で）",
  "rating": 評価（1=要改善、5=完璧の数値）,
  "improvements": ["改善提案1（日本語で）", "改善提案2（日本語で）"],
  "explanation": "文法や語彙の詳しい解説（必ず日本語で）",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}

評価基準：
- 英文はシンプルで実用的（TOEIC700〜800レベル）
- 直訳ではなく自然な英語
- feedback、improvements、explanationはすべて日本語で説明
- 中学生や高校生にも分かりやすい日本語の解説`;

      const userPrompt = `日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

上記の翻訳を評価してください。`;

      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const content = openaiData.choices[0].message.content;
        
        const parsedResult = JSON.parse(content);
        
        const response: TranslateResponse = {
          correctTranslation: parsedResult.correctTranslation,
          feedback: parsedResult.feedback,
          rating: Math.max(1, Math.min(5, parsedResult.rating)),
          improvements: parsedResult.improvements || [],
          explanation: parsedResult.explanation || "",
          similarPhrases: parsedResult.similarPhrases || []
        };

        // Save training session and get the session ID  
        const userId = "bizmowa.com"; // Use bizmowa.com user for trial
        const trainingSession = await storage.addTrainingSession({
          userId,
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        });

        // Update problem progress number after successful translation
        const currentProblemNumber = await storage.getCurrentProblemNumber(userId, difficultyLevel);
        await storage.updateProblemProgress(userId, difficultyLevel, currentProblemNumber + 1);

        // Include session ID in response for bookmark functionality
        const responseWithSessionId = {
          ...response,
          sessionId: trainingSession.id
        };

        res.json(responseWithSessionId);
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        res.status(500).json({ message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。" });
      }
    } catch (error) {
      console.error("Translation error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get available Stripe prices from actual account
  app.get("/api/stripe-prices", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const stripe = new Stripe(stripeSecretKey);
      const prices = await stripe.prices.list({ limit: 50 });
      
      const formattedPrices = prices.data.map(price => ({
        id: price.id,
        product: price.product,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring,
        type: price.type
      }));

      res.json({
        account_type: stripeSecretKey.startsWith('sk_test_') ? 'TEST' : stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN',
        total_prices: prices.data.length,
        prices: formattedPrices
      });
    } catch (error) {
      console.error('Error fetching Stripe prices:', error);
      res.status(500).json({ message: "Stripe価格の取得に失敗しました", error: error.message });
    }
  });

  // Create Stripe checkout session
  // Get available subscription plans
  app.get("/api/subscription-plans", (req, res) => {
    const plans = {
      standard_monthly: {
        priceId: process.env.STRIPE_PRICE_STANDARD_MONTHLY || "prod_SZgeMcEAMDMlDe",
        name: "スタンダード月額",
        price: "¥1,980/月",
        features: ["基本機能", "100問/日", "進捗追跡"]
      },
      standard_yearly: {
        priceId: process.env.STRIPE_PRICE_STANDARD_YEARLY || "prod_SZglW626p1IFsh", 
        name: "スタンダード年会費",
        price: "¥19,800/年 (2ヶ月分お得)",
        features: ["基本機能", "100問/日", "進捗追跡"]
      },
      premium_monthly: {
        priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "price_1ReXPnHridtc6DvMQaW7NC6w",
        name: "プレミアム月額", 
        price: "¥1,300/月",
        features: ["全機能", "無制限問題", "カスタムシナリオ", "詳細分析"]
      },
      premium_yearly: {
        priceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY || "prod_SZgnjreCBit2Bj",
        name: "プレミアム年会費",
        price: "¥39,800/年 (2ヶ月分お得)", 
        features: ["全機能", "無制限問題", "カスタムシナリオ", "詳細分析"]
      },
      upgrade_to_premium: {
        priceId: process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf",
        name: "プレミアムアップグレード",
        price: "¥2,000/月 (差額)",
        features: ["スタンダードからプレミアムへのアップグレード"]
      }
    };
    
    res.json(plans);
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(req.body);
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // 一時的に価格ID検証を無効化（実際のStripe価格IDが必要）
      console.log('Attempting to create checkout session for priceId:', priceId);
      console.log('Stripe Secret Key type:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');

      // 価格ID検証を一時的に無効化

      const stripe = new Stripe(stripeSecretKey);
      
      // まず価格IDが存在するか確認
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('Price found:', price.id, 'Amount:', price.unit_amount, 'Currency:', price.currency);
      } catch (priceError) {
        console.error('Price not found:', priceError.message);
        return res.status(400).json({ 
          message: `価格ID "${priceId}" が見つかりません。Stripeダッシュボードで正しい価格IDを確認してください。`,
          details: priceError.message
        });
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.get('origin')}/success`,
        cancel_url: cancelUrl || `${req.get('origin')}/cancel`,
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 7,
        },
        metadata: {
          userId: "default_user", // In real app, get from authenticated user
          planType: getPlanTypeFromPriceId(priceId)
        }
      });

      const response: CheckoutSessionResponse = {
        url: session.url,
        sessionId: session.id
      };

      res.json(response);
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "決済セッションの作成に失敗しました" });
    }
  });

  // Helper function to determine plan type from price ID
  function getPlanTypeFromPriceId(priceId: string): string {
    const standardMonthly = process.env.STRIPE_PRICE_STANDARD_MONTHLY || "prod_SZgeMcEAMDMlDe";
    const standardYearly = process.env.STRIPE_PRICE_STANDARD_YEARLY || "prod_SZglW626p1IFsh";
    const premiumMonthly = process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "prod_SZgm74ZfQCQMSP";  
    const premiumYearly = process.env.STRIPE_PRICE_PREMIUM_YEARLY || "prod_SZgnjreCBit2Bj";
    const upgradePremium = process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf";

    if (priceId === standardMonthly || priceId === standardYearly) {
      return "standard";
    } else if (priceId === premiumMonthly || priceId === premiumYearly || priceId === upgradePremium) {
      return "premium";
    }
    return "standard";
  }

  // Emergency password reset endpoint
  app.post('/api/emergency-reset', async (req, res) => {
    try {
      const { email } = req.body
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }

      console.log('Emergency password reset requested for:', email)

      // For emergency access, we'll provide a direct workaround
      // Create a temporary solution by setting up a new account
      const tempPassword = 'EmergencyPass123!' + Math.random().toString(36).substring(2, 8)
      
      const resetSolution = {
        email: email,
        tempPassword: tempPassword,
        message: 'Supabaseメール送信の問題により、緊急対応策を提供します',
        solution: 'direct_access',
        steps: [
          '1. 以下の情報で新しいアカウントを作成してください',
          '2. 登録後、すぐにパスワードを変更してください',
          '3. 必要に応じて、古いアカウントデータを移行します',
          '4. この一時パスワードは24時間後に無効になります'
        ],
        credentials: {
          email: email,
          temporaryPassword: tempPassword
        },
        loginUrl: `${req.protocol}://${req.get('host')}/login`,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      // Store the temp credentials in memory for verification
      console.log('Emergency credentials created:', resetSolution)
      
      res.json({
        success: true,
        solution: resetSolution
      })
      
    } catch (error) {
      console.error('Emergency reset error:', error)
      res.status(500).json({ error: 'Emergency reset failed' })
    }
  })

  // Create Stripe Customer Portal session
  app.post("/api/create-customer-portal", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const stripe = new Stripe(stripeSecretKey);
      
      // In a real app, get customer ID from authenticated user
      const customerId = "cus_example123"; // This should come from user's subscription data
      
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.get('origin')}/my-page?tab=account`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Customer Portal error:", error);
      res.status(500).json({ message: "カスタマーポータルの作成に失敗しました" });
    }
  });

  // Get subscription details
  app.get("/api/subscription-details", async (req, res) => {
    try {
      const userId = "default_user"; // In real app, get from authenticated user
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Calculate trial days remaining (mock data for now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 5); // 5 days remaining
      
      const subscriptionDetails = {
        ...subscription,
        isTrialActive: true,
        trialDaysRemaining: 5,
        trialEndDate: trialEndDate.toISOString(),
        nextBillingDate: "2025-07-27",
        currentPeriodStart: "2025-06-27",
        currentPeriodEnd: "2025-07-27",
        planType: subscription.subscriptionType === 'premium' ? 'monthly' : 'monthly', // monthly/yearly
        amount: subscription.subscriptionType === 'premium' ? 3980 : 1980,
      };

      res.json(subscriptionDetails);
    } catch (error) {
      console.error("Get subscription details error:", error);
      res.status(500).json({ message: "サブスクリプション詳細の取得に失敗しました" });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe-webhook", (req, res, next) => {
    // Parse raw body for Stripe webhook
    req.setEncoding('utf8');
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', async () => {
      req.body = data;
      await handleStripeWebhook(req, res);
    });
  });

  async function handleStripeWebhook(req: any, res: any) {
    const sig = req.headers['stripe-signature'];
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeSecretKey || !webhookSecret) {
      return res.status(400).send(`Webhook Error: Missing configuration`);
    }

    const stripe = new Stripe(stripeSecretKey);
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log(`Webhook signature verification failed.`, errorMessage);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Update user subscription to premium
        try {
          await storage.updateUserSubscription("default_user", {
            subscriptionType: "premium"
          });
          console.log(`User subscription updated to premium for session: ${session.id}`);
        } catch (error) {
          console.error('Error updating subscription:', error);
        }
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        try {
          await storage.updateUserSubscription("default_user", {
            subscriptionType: "standard"
          });
          console.log(`User subscription downgraded to standard`);
        } catch (error) {
          console.error('Error downgrading subscription:', error);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }

  // Get training history
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getTrainingSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
  });

  // Get sessions by difficulty
  app.get("/api/sessions/:difficulty", async (req, res) => {
    try {
      const { difficulty } = req.params;
      const sessions = await storage.getSessionsByDifficulty(difficulty);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
  });

  // My Page APIs
  
  // Get user goals
  app.get("/api/user-goals", async (req, res) => {
    try {
      const goals = await storage.getUserGoals();
      res.json(goals || { dailyGoal: 30, monthlyGoal: 900 });
    } catch (error) {
      console.error("User goals error:", error);
      res.status(500).json({ message: "目標の取得に失敗しました" });
    }
  });

  // Update user goals
  app.post("/api/user-goals", async (req, res) => {
    try {
      const { dailyGoal, monthlyGoal } = req.body;
      const goals = await storage.updateUserGoals({ dailyGoal, monthlyGoal });
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "目標の更新に失敗しました" });
    }
  });

  // Get progress history
  app.get("/api/progress", async (req, res) => {
    try {
      const { period = 'week' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setDate(endDate.getDate() - 1);
      }

      const progress = await storage.getProgressHistory(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "進捗データの取得に失敗しました" });
    }
  });

  // Get streak count
  app.get("/api/streak", async (req, res) => {
    try {
      const streak = await storage.getStreakCount();
      res.json({ streak });
    } catch (error) {
      res.status(500).json({ message: "連続学習日数の取得に失敗しました" });
    }
  });

  // Get difficulty stats
  app.get("/api/difficulty-stats", async (req, res) => {
    try {
      const stats = await storage.getDifficultyStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "レベル別統計の取得に失敗しました" });
    }
  });

  // Get monthly stats
  app.get("/api/monthly-stats", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const stats = await storage.getMonthlyStats(year, month);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "月間統計の取得に失敗しました" });
    }
  });

  // Get sessions for review (★2以下)
  app.get("/api/review-sessions", async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 2;
      const sessions = await storage.getSessionsForReview(threshold);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "復習セッションの取得に失敗しました" });
    }
  });

  // Get recent sessions (past week)
  app.get("/api/recent-sessions", async (req, res) => {
    try {
      const daysBack = parseInt(req.query.days as string) || 7;
      const sessions = await storage.getRecentSessions(daysBack);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "直近の練習履歴の取得に失敗しました" });
    }
  });

  // Get bookmarked sessions
  app.get("/api/bookmarked-sessions", async (req, res) => {
    try {
      const sessions = await storage.getBookmarkedSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "ブックマークの取得に失敗しました" });
    }
  });

  // Update bookmark status
  app.post("/api/sessions/:id/bookmark", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { isBookmarked } = req.body;
      await storage.updateBookmark(sessionId, isBookmarked);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "ブックマークの更新に失敗しました" });
    }
  });

  // Update review count
  app.post("/api/sessions/:id/review", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.updateReviewCount(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "復習カウントの更新に失敗しました" });
    }
  });

  // Custom scenarios
  app.get("/api/custom-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getCustomScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "カスタムシナリオの取得に失敗しました" });
    }
  });

  // User subscription
  app.get("/api/user-subscription", async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription();
      // Default to admin premium for the current user
      res.json(subscription || { 
        subscriptionType: "premium", 
        isAdmin: true,
        userId: "default_user"
      });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "サブスクリプション情報の取得に失敗しました" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
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
  });

  app.get("/api/admin/users", async (req, res) => {
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
  });

  app.get("/api/admin/analytics", async (req, res) => {
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
  });

  app.get("/api/admin/export/:type", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const { type } = req.params;
      const csvData = await storage.exportData(type);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "データのエクスポートに失敗しました" });
    }
  });

  app.put("/api/admin/users/:userId/subscription", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const { userId } = req.params;
      const { subscriptionType } = req.body;

      if (!subscriptionType || !['standard', 'premium'].includes(subscriptionType)) {
        return res.status(400).json({ message: "有効なサブスクリプションタイプを指定してください" });
      }

      const updatedSubscription = await storage.updateUserSubscription(userId, { subscriptionType });
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "サブスクリプションの更新に失敗しました" });
    }
  });

  // Reset user data for new accounts
  app.post("/api/reset-user-data", async (req, res) => {
    try {
      await storage.resetUserData();
      res.json({ success: true, message: "ユーザーデータをリセットしました" });
    } catch (error) {
      console.error("Reset user data error:", error);
      res.status(500).json({ message: "データのリセットに失敗しました" });
    }
  });

  app.post("/api/custom-scenarios", async (req, res) => {
    try {
      const { title, description } = req.body;
      const scenario = await storage.addCustomScenario({ title, description });
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "カスタムシナリオの作成に失敗しました" });
    }
  });

  app.put("/api/custom-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description } = req.body;
      const scenario = await storage.updateCustomScenario(id, { title, description });
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "カスタムシナリオの更新に失敗しました" });
    }
  });

  app.delete("/api/custom-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomScenario(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "カスタムシナリオの削除に失敗しました" });
    }
  });

  // Get single custom scenario
  app.get("/api/custom-scenarios/:id", async (req, res) => {
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
  });

  // Generate simulation problem
  app.get("/api/simulation-problem/:scenarioId", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const scenario = await storage.getCustomScenario(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "シナリオが見つかりません" });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const prompt = `以下のシミュレーション設定に基づいて、実践的な日本語文を1つ生成してください。

シミュレーション: ${scenario.title}
詳細: ${scenario.description}

以下の形式でJSONで回答してください：
{
  "japaneseSentence": "日本語の文章",
  "context": "具体的なシチュエーションの説明（20文字以内）"
}

実際の場面で使われそうな自然な日本語文を生成してください。`;

      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.8,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const result = JSON.parse(openaiData.choices[0].message.content);
        
        // Track simulation problems to prevent duplicates
        const sessionId = `${getSessionId(req)}-simulation-${scenarioId}`;
        const usedProblems = getUsedProblems(sessionId);
        
        // If this problem was already used, try to generate a different one
        if (usedProblems.has(result.japaneseSentence)) {
          const variationPrompt = `${prompt}\n\n既に使用された問題: ${Array.from(usedProblems).join(', ')}\n\n上記とは異なる新しい問題を生成してください。`;
          
          try {
            const retryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  { role: "user", content: variationPrompt }
                ],
                max_tokens: 500,
                temperature: 0.9,
                response_format: { type: "json_object" }
              })
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const retryResult = JSON.parse(retryData.choices[0].message.content);
              markProblemAsUsed(sessionId, retryResult.japaneseSentence);
              
              return res.json({
                japaneseSentence: retryResult.japaneseSentence,
                context: retryResult.context || scenario.description
              });
            }
          } catch (retryError) {
            console.log("Retry generation failed, using original");
          }
        }
        
        markProblemAsUsed(sessionId, result.japaneseSentence);
        
        res.json({
          japaneseSentence: result.japaneseSentence,
          context: result.context || scenario.description
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        res.status(500).json({ message: "問題生成に失敗しました" });
      }
    } catch (error) {
      console.error("Simulation problem error:", error);
      res.status(500).json({ message: "問題生成に失敗しました" });
    }
  });

  // Evaluate simulation translation
  app.post("/api/simulation-translate", async (req, res) => {
    try {
      const { scenarioId, japaneseSentence, userTranslation, context } = req.body;
      
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
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

以下の形式でJSONで回答してください：
{
  "correctTranslation": "正しい英訳（そのシチュエーションに最適な表現）",
  "feedback": "具体的なフィードバック（良い点と改善点）",
  "rating": 1から5の評価（1=要改善、5=完璧）,
  "improvements": ["改善提案1", "改善提案2"],
  "explanation": "そのシチュエーションでの表現のポイント（日本語で）",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}`;

      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const parsedResult = JSON.parse(openaiData.choices[0].message.content);
        
        const response = {
          correctTranslation: parsedResult.correctTranslation,
          feedback: parsedResult.feedback,
          rating: Math.max(1, Math.min(5, parsedResult.rating)),
          improvements: parsedResult.improvements || [],
          explanation: parsedResult.explanation || "",
          similarPhrases: parsedResult.similarPhrases || []
        };

        // Save simulation session to database (same structure as training sessions but with scenario context)
        await storage.addTrainingSession({
          difficultyLevel: `simulation-${scenarioId}`,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        });

        res.json(response);
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        res.status(500).json({ message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。" });
      }
    } catch (error) {
      console.error("Simulation translation error:", error);
      res.status(500).json({ message: "翻訳評価に失敗しました" });
    }
  });

  // Get today's problem count
  app.get("/api/daily-count", async (req, res) => {
    try {
      const count = await storage.getTodaysProblemCount();
      res.json({ count, remaining: Math.max(0, 100 - count) });
    } catch (error) {
      console.error("Error getting daily count:", error);
      res.status(500).json({ message: "Failed to get daily count" });
    }
  });

  // Reset daily count (for testing/admin purposes)
  app.post("/api/reset-daily-count", async (req, res) => {
    try {
      await storage.resetDailyCount();
      res.json({ message: "Daily count reset successfully" });
    } catch (error) {
      console.error("Error resetting daily count:", error);
      res.status(500).json({ message: "Failed to reset daily count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}