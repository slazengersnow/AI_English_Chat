// server/routes/index.ts
import { Router, type Express, type Request, type Response } from "express";
import adminRoutes from './admin.js';

/**
 * /api 配下のルーティングを一括登録する
 * 重要：ここで「だけ」/api/problem 等を定義し、他の場所で重複定義しないこと
 */
export function registerRoutes(app: Express) {
  const router = Router();

  // ---- ヘルスチェック ----
  router.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // ---- デバッグ用エンドポイント ----
  router.post("/test-auth", handleTestAuth);
  router.get("/supabase-status", handleSupabaseStatus);

  // ---- Claude関連のコアAPI ----
  router.post("/problem", handleProblemGeneration);
  router.post("/evaluate-with-claude", handleClaudeEvaluation);
  router.post("/evaluate", handleBasicEvaluation);

  // ---- チャット関連 ----
  router.post("/chat/send", handleChatSend);
  router.get("/chat/history", handleChatHistory);

  // ---- ユーザー関連 ----
  router.get("/user/profile", handleUserProfile);
  router.put("/user/profile", handleUpdateUserProfile);
  router.get("/user/stats", handleUserStats);

  // ---- 学習セッション関連 ----
  router.get("/sessions", handleGetSessions);
  router.post("/sessions", handleCreateSession);
  router.put("/sessions/:id", handleUpdateSession);
  router.delete("/sessions/:id", handleDeleteSession);

  // ---- ブックマーク関連 ----
  router.get("/bookmarks", handleGetBookmarks);
  router.post("/bookmarks/:sessionId", handleToggleBookmark);

  // ---- カスタムシナリオ関連 ----
  router.get("/scenarios", handleGetScenarios);
  router.post("/scenarios", handleCreateScenario);
  router.put("/scenarios/:id", handleUpdateScenario);
  router.delete("/scenarios/:id", handleDeleteScenario);

  // ---- 管理者用ルート追加 ----
  router.use('/admin', adminRoutes);

  // すべて /api 配下にぶら下げる
  app.use("/api", router);

  console.log("✅ All API routes registered successfully");
}

// ---- ハンドラー関数の実装 ----

// Claude関連ハンドラー
async function handleProblemGeneration(req: Request, res: Response) {
  try {
    const { topic, difficulty, type } = req.body;

    // TODO: 実際のClaude API統合
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

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error("Problem generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate problem",
    });
  }
}

async function handleClaudeEvaluation(req: Request, res: Response) {
  try {
    const { userAnswer, problemContext, criteria } = req.body;

    // TODO: 実際のClaude API統合
    const evaluation = {
      score: Math.floor(Math.random() * 100) + 1,
      feedback: "良い回答です。文法的に正しく、自然な表現が使われています。",
      suggestions: [
        "より自然な表現を使ってみましょう",
        "語彙を増やすと表現力が向上します",
      ],
      correctTranslation: "This is a correct translation example.",
      rating: Math.floor(Math.random() * 5) + 1,
      evaluatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Claude evaluation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to evaluate response",
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
    res.status(500).json({
      success: false,
      error: "Failed to evaluate",
    });
  }
}

// デバッグ関連ハンドラー
async function handleTestAuth(req: Request, res: Response) {
  try {
    // TODO: 実際の認証テスト実装
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: "test-user-123",
        email: "test@example.com",
      },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    res.status(500).json({
      success: false,
      error: "Auth test failed",
    });
  }
}

async function handleSupabaseStatus(req: Request, res: Response) {
  try {
    // TODO: 実際のSupabase接続確認
    res.json({
      success: true,
      connected: true,
      status: "Supabase connection is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Supabase status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check Supabase status",
    });
  }
}

// チャット関連ハンドラー
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
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
}

async function handleChatHistory(req: Request, res: Response) {
  try {
    // TODO: 実際のチャット履歴取得
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Chat history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat history",
    });
  }
}

// ユーザー関連ハンドラー
async function handleUserProfile(req: Request, res: Response) {
  try {
    // TODO: 実際のユーザープロフィール取得
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
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
    });
  }
}

async function handleUpdateUserProfile(req: Request, res: Response) {
  try {
    const updates = req.body;

    // TODO: 実際のプロフィール更新
    res.json({
      success: true,
      data: {
        message: "Profile updated successfully",
        updates,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
}

async function handleUserStats(req: Request, res: Response) {
  try {
    // TODO: 実際の統計データ取得
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
    res.status(500).json({
      success: false,
      error: "Failed to get user stats",
    });
  }
}

// セッション関連ハンドラー
async function handleGetSessions(req: Request, res: Response) {
  try {
    // TODO: 実際のセッション取得
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get sessions",
    });
  }
}

async function handleCreateSession(req: Request, res: Response) {
  try {
    const sessionData = req.body;

    // TODO: 実際のセッション作成
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
    res.status(500).json({
      success: false,
      error: "Failed to create session",
    });
  }
}

async function handleUpdateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // TODO: 実際のセッション更新
    res.json({
      success: true,
      data: {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update session",
    });
  }
}

async function handleDeleteSession(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // TODO: 実際のセッション削除
    res.json({
      success: true,
      data: {
        message: `Session ${id} deleted successfully`,
      },
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session",
    });
  }
}

// ブックマーク関連ハンドラー
async function handleGetBookmarks(req: Request, res: Response) {
  try {
    // TODO: 実際のブックマーク取得
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get bookmarks",
    });
  }
}

async function handleToggleBookmark(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { isBookmarked } = req.body;

    // TODO: 実際のブックマーク切り替え
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
    res.status(500).json({
      success: false,
      error: "Failed to toggle bookmark",
    });
  }
}

// シナリオ関連ハンドラー
async function handleGetScenarios(req: Request, res: Response) {
  try {
    // TODO: 実際のシナリオ取得
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Get scenarios error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get scenarios",
    });
  }
}

async function handleCreateScenario(req: Request, res: Response) {
  try {
    const scenarioData = req.body;

    // TODO: 実際のシナリオ作成
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
    res.status(500).json({
      success: false,
      error: "Failed to create scenario",
    });
  }
}

async function handleUpdateScenario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // TODO: 実際のシナリオ更新
    res.json({
      success: true,
      data: {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update scenario error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update scenario",
    });
  }
}

async function handleDeleteScenario(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // TODO: 実際のシナリオ削除
    res.json({
      success: true,
      data: {
        message: `Scenario ${id} deleted successfully`,
      },
    });
  } catch (error) {
    console.error("Delete scenario error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete scenario",
    });
  }
}
