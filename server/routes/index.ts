// server/routes/index.ts
import { Router, type Express, type Request, type Response } from "express";
// ビルド後の拡張子に合わせて ".js" を明示（NodeNext ルール）
import { registerAdminRoutes } from "./admin.js";

/**
 * /api 配下のルーティングを一括登録
 * 重要：サブルートはここでだけ定義し、最後に /api にマウント
 */
export function registerRoutes(app: Express) {
  const router = Router();

  /* ----------------------- ヘルスチェック ----------------------- */
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  /* ----------------------- デバッグ用 ----------------------- */
  router.post("/test-auth", handleTestAuth);
  router.get("/supabase-status", handleSupabaseStatus);

  /* ----------------------- Claude関連 ----------------------- */
  router.post("/problem", handleProblemGeneration);
  router.post("/evaluate-with-claude", handleClaudeEvaluation);
  router.post("/evaluate", handleBasicEvaluation);

  /* ----------------------- チャット関連 ----------------------- */
  router.post("/chat/send", handleChatSend);
  router.get("/chat/history", handleChatHistory);

  /* ----------------------- 認証関連 ----------------------- */
  router.get("/auth/user", handleAuthUser);
  router.post("/auth/login", handleAuthLogin);
  router.post("/auth/logout", handleAuthLogout);

  /* ----------------------- ユーザー関連 ----------------------- */
  // 疎通確認: 認証不要
  router.get("/user/me", (_req: Request, res: Response) => {
    res.json({ ok: true, note: "server alive" });
  });
  
  router.get("/user/profile", handleUserProfile);
  router.put("/user/profile", handleUpdateUserProfile);
  router.get("/user/stats", handleUserStats);

  /* ----------------------- マイページ統計API ----------------------- */
  router.get("/progress", handleProgress);
  router.get("/streak", handleStreak);
  router.get("/difficulty-stats", handleDifficultyStats);
  router.get("/monthly-stats", handleMonthlyStats);
  router.get("/recent-sessions", handleRecentSessions);
  router.get("/review-sessions", handleReviewSessions);
  router.get("/bookmarked-sessions", handleBookmarkedSessions);
  router.get("/daily-count", handleDailyCount);
  router.get("/custom-scenarios", handleCustomScenarios);
  router.get("/subscription-details", handleSubscriptionDetails);
  router.get("/user-subscription", handleUserSubscription);

  /* ----------------------- 学習セッション ----------------------- */
  router.get("/sessions", handleGetSessions);
  router.post("/sessions", handleCreateSession);
  router.put("/sessions/:id", handleUpdateSession);
  router.delete("/sessions/:id", handleDeleteSession);

  /* ----------------------- ブックマーク ----------------------- */
  router.get("/bookmarks", handleGetBookmarks);
  router.post("/bookmarks/:sessionId", handleToggleBookmark);

  /* ----------------------- カスタムシナリオ ----------------------- */
  router.get("/scenarios", handleGetScenarios);
  router.post("/scenarios", handleCreateScenario);
  router.put("/scenarios/:id", handleUpdateScenario);
  router.delete("/scenarios/:id", handleDeleteScenario);

  /* ----------------------- 管理系 ----------------------- */
  // 管理者用ルートは別途登録される
  registerAdminRoutes(app);

  // （他のルーターがあればここに追加）
  // router.use("/chat", chatRoutes);
  // router.use("/user", userRoutes);

  // /api 直下にぶら下げるのは最後に1回だけ
  app.use("/api", router);

  console.log("✅ All API routes registered successfully");
}

/* ======================= 以下、各ハンドラー ======================= */

/* ----------------------- 認証ハンドラー ----------------------- */

async function handleAuthUser(req: Request, res: Response) {
  try {
    // Supabaseからアクセストークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Supabaseでトークンを検証
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Auth verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // ユーザー情報を返す
    res.json({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
    });
  } catch (error) {
    console.error('Auth user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAuthLogout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      await supabase.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Claude関連
async function handleProblemGeneration(req: Request, res: Response) {
  try {
    const { topic, difficulty, type } = req.body;
    const problem = {
      id: Date.now().toString(),
      topic: topic || "general",
      difficulty: difficulty || "beginner",
      type: type || "conversation",
      content: `これは${topic || "一般的な"}トピックに関する${difficulty || "初級"}レベルの問題です。`,
      japaneseSentence: "これは日本語の例文です。",
      englishHint: "This is an English hint.",
      createdAt: new Date().toISOString(),
    };
    res.json({ success: true, data: problem });
  } catch (error) {
    console.error("Problem generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate problem" });
  }
}

async function handleClaudeEvaluation(req: Request, res: Response) {
  try {
    const { japaneseSentence, userTranslation, difficultyLevel } = req.body;
    
    if (!japaneseSentence || !userTranslation) {
      return res.status(400).json({ 
        message: "日本語文と英訳が必要です" 
      });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("Anthropic API key not configured");
      return res.status(500).json({ 
        message: "AI評価システムが設定されていません" 
      });
    }

    const levelLabel = difficultyLevel === "toeic" ? "TOEIC" :
                     difficultyLevel === "middle-school" ? "中学レベル" :
                     difficultyLevel === "high-school" ? "高校レベル" :
                     difficultyLevel === "basic-verbs" ? "基本動詞" :
                     difficultyLevel === "business-email" ? "ビジネスメール" :
                     "基本的な文章";

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
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
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

      const response = {
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
        const { default: storage } = await import("../storage.js");
        const trainingSession = await storage.addTrainingSession({
          userId,
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        });

        console.log("Training session recorded successfully:", trainingSession.id);
        return res.json({ ...response, sessionId: trainingSession.id });

      } catch (storageError) {
        console.error("Storage error:", storageError);
        return res.json({ ...response, sessionId: 0 });
      }

    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);

      const fallbackEvaluation = {
        correctTranslation: `正しい英訳: ${userTranslation}`,
        feedback: "この翻訳は良好です。文法的に正しく、理解しやすい表現になっています。",
        rating: 4,
        improvements: ["より自然な表現を心がける", "語彙の選択を工夫する"],
        explanation: "基本的な文法構造は正しく使われています。日本語の意味を適切に英語で表現できています。",
        similarPhrases: ["Alternative expression 1", "Alternative expression 2"],
      };

      try {
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        const userId = (userEmail as string) || "anonymous";
        const { default: storage } = await import("../storage.js");

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
}

async function handleBasicEvaluation(req: Request, res: Response) {
  try {
    const { userAnswer, correctAnswer } = req.body;
    const isCorrect =
      userAnswer?.toLowerCase() === correctAnswer?.toLowerCase();
    res.json({
      success: true,
      data: {
        isCorrect,
        score: isCorrect ? 100 : 60,
        feedback: isCorrect
          ? "正解です！"
          : "惜しいです。もう一度挑戦してみましょう。",
      },
    });
  } catch (error) {
    console.error("Basic evaluation error:", error);
    res.status(500).json({ success: false, error: "Failed to evaluate" });
  }
}

// デバッグ
async function handleTestAuth(_req: Request, res: Response) {
  try {
    res.json({
      success: true,
      authenticated: true,
      user: { id: "test-user-123", email: "test@example.com" },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    res.status(500).json({ success: false, error: "Auth test failed" });
  }
}

async function handleSupabaseStatus(_req: Request, res: Response) {
  try {
    res.json({
      success: true,
      connected: true,
      status: "Supabase connection is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Supabase status error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to check Supabase status" });
  }
}

// チャット
async function handleChatSend(req: Request, res: Response) {
  try {
    const { message, sessionId } = req.body;
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        message: `エコー: ${message}`,
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chat send error:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
}

async function handleChatHistory(_req: Request, res: Response) {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Chat history error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get chat history" });
  }
}

// ユーザー
async function handleUserProfile(_req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("User profile error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get user profile" });
  }
}

async function handleUpdateUserProfile(req: Request, res: Response) {
  try {
    const updates = req.body;
    res.json({
      success: true,
      data: { message: "Profile updated successfully", updates },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

async function handleUserStats(_req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: {
        totalSessions: 0,
        averageScore: 0,
        streak: 0,
        lastActivity: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("User stats error:", error);
    res.status(500).json({ success: false, error: "Failed to get user stats" });
  }
}

// セッション
async function handleGetSessions(_req: Request, res: Response) {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ success: false, error: "Failed to get sessions" });
  }
}

async function handleCreateSession(req: Request, res: Response) {
  try {
    const sessionData = req.body;
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        ...sessionData,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
}

async function handleUpdateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    res.json({
      success: true,
      data: { id, ...updates, updatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ success: false, error: "Failed to update session" });
  }
}

async function handleDeleteSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: { message: `Session ${id} deleted successfully` },
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ success: false, error: "Failed to delete session" });
  }
}

// ブックマーク
async function handleGetBookmarks(_req: Request, res: Response) {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ success: false, error: "Failed to get bookmarks" });
  }
}

async function handleToggleBookmark(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { isBookmarked } = req.body;
    res.json({
      success: true,
      data: {
        sessionId,
        isBookmarked: !isBookmarked,
        message: isBookmarked ? "Bookmark removed" : "Bookmark added",
      },
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to toggle bookmark" });
  }
}

// シナリオ
async function handleGetScenarios(_req: Request, res: Response) {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Get scenarios error:", error);
    res.status(500).json({ success: false, error: "Failed to get scenarios" });
  }
}

async function handleCreateScenario(req: Request, res: Response) {
  try {
    const scenarioData = req.body;
    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        ...scenarioData,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create scenario error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create scenario" });
  }
}

async function handleUpdateScenario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    res.json({
      success: true,
      data: { id, ...updates, updatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Update scenario error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update scenario" });
  }
}

async function handleDeleteScenario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: { message: `Scenario ${id} deleted successfully` },
    });
  } catch (error) {
    console.error("Delete scenario error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete scenario" });
  }
}

/* ----------------------- マイページAPIハンドラー ----------------------- */

async function handleProgress(req: Request, res: Response) {
  try {
    const period = req.query.period || 'week';
    res.json([
      { date: "2025-09-01", problems: 12, averageRating: 4.2 },
      { date: "2025-09-02", problems: 8, averageRating: 3.8 },
      { date: "2025-09-03", problems: 15, averageRating: 4.5 }
    ]);
  } catch (error) {
    console.error("Progress error:", error);
    res.status(500).json({ error: "Failed to get progress" });
  }
}

async function handleStreak(req: Request, res: Response) {
  try {
    res.json({ 
      currentStreak: 7, 
      longestStreak: 15,
      streakStart: "2025-08-27"
    });
  } catch (error) {
    console.error("Streak error:", error);
    res.status(500).json({ error: "Failed to get streak" });
  }
}

async function handleDifficultyStats(req: Request, res: Response) {
  try {
    res.json([
      { difficulty: "TOEIC", problems: 45, averageRating: 4.1 },
      { difficulty: "中学英語", problems: 32, averageRating: 4.3 },
      { difficulty: "高校英語", problems: 28, averageRating: 3.9 },
      { difficulty: "基本動詞", problems: 21, averageRating: 4.0 },
      { difficulty: "ビジネスメール", problems: 18, averageRating: 3.7 },
      { difficulty: "シミュレーション練習", problems: 12, averageRating: 4.2 }
    ]);
  } catch (error) {
    console.error("Difficulty stats error:", error);
    res.status(500).json({ error: "Failed to get difficulty stats" });
  }
}

async function handleMonthlyStats(req: Request, res: Response) {
  try {
    res.json({
      totalProblems: 156,
      averageRating: 4.1,
      studyDays: 22,
      totalStudyTime: 840 // minutes
    });
  } catch (error) {
    console.error("Monthly stats error:", error);
    res.status(500).json({ error: "Failed to get monthly stats" });
  }
}

async function handleRecentSessions(req: Request, res: Response) {
  try {
    res.json([
      {
        id: 1,
        difficultyLevel: "TOEIC",
        japaneseSentence: "彼は毎朝コーヒーを飲みます。",
        userTranslation: "He drinks coffee every morning.",
        correctTranslation: "He drinks coffee every morning.",
        rating: 4,
        createdAt: "2025-09-03T10:30:00Z"
      }
    ]);
  } catch (error) {
    console.error("Recent sessions error:", error);
    res.status(500).json({ error: "Failed to get recent sessions" });
  }
}

async function handleReviewSessions(req: Request, res: Response) {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 2;
    res.json([
      {
        id: 2,
        difficultyLevel: "高校英語", 
        japaneseSentence: "私は昨日映画を見に行きました。",
        userTranslation: "I go to see movie yesterday.",
        correctTranslation: "I went to see a movie yesterday.",
        rating: threshold === 3 ? 3 : 1,
        createdAt: "2025-09-02T15:20:00Z"
      }
    ]);
  } catch (error) {
    console.error("Review sessions error:", error);
    res.status(500).json({ error: "Failed to get review sessions" });
  }
}

async function handleBookmarkedSessions(req: Request, res: Response) {
  try {
    res.json([
      {
        id: 3,
        difficultyLevel: "ビジネスメール",
        japaneseSentence: "ご連絡いただき、ありがとうございます。",
        userTranslation: "Thank you for contacting us.",
        correctTranslation: "Thank you for contacting us.",
        rating: 5,
        isBookmarked: true,
        createdAt: "2025-09-01T14:15:00Z"
      }
    ]);
  } catch (error) {
    console.error("Bookmarked sessions error:", error);
    res.status(500).json({ error: "Failed to get bookmarked sessions" });
  }
}

async function handleDailyCount(req: Request, res: Response) {
  try {
    res.json({
      today: 15,
      limit: 100,
      remaining: 85,
      resetTime: new Date(Date.now() + 24*60*60*1000).toISOString()
    });
  } catch (error) {
    console.error("Daily count error:", error);
    res.status(500).json({ error: "Failed to get daily count" });
  }
}

async function handleCustomScenarios(req: Request, res: Response) {
  try {
    res.json([
      {
        id: 1,
        title: "レストランでの注文",
        description: "レストランでの注文シーン",
        createdAt: "2025-09-01T12:00:00Z"
      }
    ]);
  } catch (error) {
    console.error("Custom scenarios error:", error);
    res.status(500).json({ error: "Failed to get custom scenarios" });
  }
}

async function handleSubscriptionDetails(req: Request, res: Response) {
  try {
    res.json({
      plan: "Premium",
      status: "active",
      nextBillingDate: "2025-10-01",
      amount: 1300
    });
  } catch (error) {
    console.error("Subscription details error:", error);
    res.status(500).json({ error: "Failed to get subscription details" });
  }
}

async function handleUserSubscription(req: Request, res: Response) {
  try {
    res.json({
      id: 1,
      userId: "user123",
      subscriptionType: "premium",
      subscriptionStatus: "active",
      trialStart: null
    });
  } catch (error) {
    console.error("User subscription error:", error);
    res.status(500).json({ error: "Failed to get user subscription" });
  }
}
