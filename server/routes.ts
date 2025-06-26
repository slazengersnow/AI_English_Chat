import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  // Generate Japanese problem for translation
  app.post("/api/problem", async (req, res) => {
    try {
      const { difficultyLevel } = problemRequestSchema.parse(req.body);
      
      // Problem sentences by difficulty level
      const problemSets = {
        'toeic': [
          '会議の資料を準備しておいてください。',
          '売上が前年比20%増加しました。',
          '新しいプロジェクトの進捗はいかがですか。',
          '顧客からのフィードバックを検討する必要があります。',
          '来週までに報告書を提出してください。'
        ],
        'middle-school': [
          '私は毎日学校に行きます。',
          '今日は雨が降っています。',
          '彼女は本を読むのが好きです。',
          '私たちは昨日映画を見ました。',
          '明日友達と会う予定です。'
        ],
        'high-school': [
          '環境問題について考えることは重要です。',
          '技術の進歩により、私たちの生活は便利になりました。',
          '彼は将来医者になりたいと言っています。',
          'この本を読み終えたら、感想を教えてください。',
          'もし時間があれば、一緒に旅行に行きませんか。'
        ],
        'basic-verbs': [
          '彼は毎朝コーヒーを作ります。',
          '子供たちが公園で遊んでいます。',
          '母は料理を作っています。',
          '私は友達に手紙を書きました。',
          '電車が駅に到着しました。'
        ],
        'business-email': [
          'お忙しい中、お時間をいただきありがとうございます。',
          '添付ファイルをご確認いただけますでしょうか。',
          '来週の会議の件でご連絡いたします。',
          'ご質問がございましたらお気軽にお声かけください。',
          'お返事をお待ちしております。'
        ]
      };

      const sentences = problemSets[difficultyLevel];
      const sessionId = getSessionId(req);
      const selectedSentence = getUnusedProblem(sessionId, sentences);
      
      if (!selectedSentence) {
        return res.status(500).json({ message: "No problems available" });
      }
      
      markProblemAsUsed(sessionId, selectedSentence);
      
      const response: ProblemResponse = {
        japaneseSentence: selectedSentence,
        hints: []
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

      const prompt = `あなたは英語教師です。以下の日本語文の英訳を評価してください。

難易度レベル: ${difficultyLevel}
日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

以下の形式でJSONで回答してください：
{
  "correctTranslation": "正しい英訳",
  "feedback": "具体的なフィードバック（良い点と改善点）",
  "rating": 1から5の評価（1=要改善、5=完璧）,
  "improvements": ["改善提案1", "改善提案2"],
  "explanation": "文法や語彙の詳しい解説（日本語で）",
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
        const trainingSession = await storage.addTrainingSession({
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        });

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

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(req.body);
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const stripe = require("stripe")(stripeSecretKey);
      
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
        trial_period_days: 7
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

  const httpServer = createServer(app);
  return httpServer;
}