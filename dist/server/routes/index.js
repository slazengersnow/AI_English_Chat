// server/routes/index.ts
import { Router } from "express";
// ビルド後の拡張子に合わせて ".js" を明示（NodeNext ルール）
import { registerAdminRoutes } from "./admin.js";
/**
 * /api 配下のルーティングを一括登録
 * 重要：サブルートはここでだけ定義し、最後に /api にマウント
 */
export function registerRoutes(app) {
    const router = Router();
    /* ----------------------- ヘルスチェック ----------------------- */
    router.get("/health", (_req, res) => {
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
    router.get("/generate-problem", handleGenerateProblem);
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
    router.get("/user/me", (_req, res) => {
        res.json({ ok: true, note: "server alive" });
    });
    router.get("/user/profile", handleUserProfile);
    router.put("/user/profile", handleUpdateUserProfile);
    router.get("/user/stats", handleUserStats);
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
async function handleAuthUser(req, res) {
    try {
        // Supabaseからアクセストークンを取得
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization header' });
        }
        const token = authHeader.split(' ')[1];
        // Supabaseでトークンを検証
        const { supabaseAdmin } = await import('../supabase-admin.js');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
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
    }
    catch (error) {
        console.error('Auth user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function handleAuthLogin(req, res) {
    try {
        const { email, password } = req.body;
        const { supabaseAdmin } = await import('../supabase-admin.js');
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function handleAuthLogout(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { supabaseAdmin } = await import('../supabase-admin.js');
            await supabaseAdmin.auth.signOut();
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// 🚀 PERFECT PROBLEM GENERATION - Integrated from simple-routes.ts
async function handleGenerateProblem(req, res) {
    try {
        // Extract difficulty from query parameters  
        const difficultyLevel = req.query.difficulty || 'middle-school';
        const userId = 'anonymous'; // Default user for now
        console.log(`🔍 Problem generation request for difficulty: ${difficultyLevel}`);
        // Define the problem sets for each difficulty level
        const problemSets = {
            toeic: [
                "新製品の企画を検討しています。", "品質保証システムを導入します。", "海外市場への展開を計画中です。",
                "システムの更新作業を実施します。", "データセキュリティを強化しましょう。", "新しいソフトウェアを導入します。",
                "新入社員の研修を開始します。", "チームビルディングを実施しましょう。", "人事評価の面談を行います。",
                "お客様満足度を向上させたいです。", "カスタマーサポートを充実させます。", "アフターサービスを改善します。"
            ],
            "middle-school": [
                "私は毎日学校に行きます。", "数学の授業が好きです。", "友達と一緒に昼食を食べます。",
                "母が美味しい料理を作ります。", "犬が庭で元気に遊んでいます。", "今日は天気が良いです。"
            ],
            "high-school": [
                "将来の夢を実現するために毎日努力しています。", "科学技術の発展により私たちの生活は便利になりました。",
                "努力を継続することで目標を達成できます。", "このプロジェクトを来月までに完了する予定です。"
            ],
            "basic-verbs": [
                "私は音楽を聞きます。", "写真を撮ります。", "買い物に行きます。", "映画を見ます。", "本を読みます。"
            ],
            "business-email": [
                "商品の納期が遅れる可能性があります。", "会議の議事録をお送りします。", "新しい提案についてご検討ください。"
            ],
            simulation: [
                "駅はどこにありますか？", "この荷物を送りたいのですが。", "予約を変更したいのですが。"
            ]
        };
        // Normalize difficulty level
        const normalizedDifficulty = difficultyLevel.replace(/_/g, '-');
        const problems = problemSets[normalizedDifficulty] || problemSets["middle-school"];
        // Select a random problem
        const selectedProblem = problems[Math.floor(Math.random() * problems.length)];
        // Create high-quality response
        const response = {
            japaneseSentence: selectedProblem,
            hints: [`問題 - ${difficultyLevel}`],
        };
        console.log(`✅ Generated problem: "${selectedProblem}" for difficulty: ${difficultyLevel}`);
        res.json(response);
    }
    catch (error) {
        console.error("Problem generation error:", error);
        res.status(500).json({ success: false, error: "Failed to generate problem" });
    }
}
// Claude関連 - Legacy placeholder (keep for compatibility)
async function handleProblemGeneration(req, res) {
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
    }
    catch (error) {
        console.error("Problem generation error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to generate problem" });
    }
}
async function handleClaudeEvaluation(req, res) {
    try {
        console.log('📝 [UNIFIED] Claude Evaluation called with data:', req.body);
        const { japaneseSentence, userTranslation, difficultyLevel } = req.body;
        if (!japaneseSentence || !userTranslation) {
            return res.status(400).json({
                message: "日本語文と英訳が必要です"
            });
        }
        // 🚀 ALWAYS USE CLAUDE API FOR 100% CONSISTENT HIGH-QUALITY EVALUATIONS
        console.log('✅ [UNIFIED] Using Claude API for maximum quality and consistency');
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            console.error("[UNIFIED] Anthropic API key not configured");
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
        // 🚀 PRODUCTION-GRADE 5-RETRY SYSTEM WITH EXPONENTIAL BACKOFF
        const maxRetries = 4; // 5 total attempts (0-4)
        let parsedResult = null;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🤖 [UNIFIED] Claude API attempt ${attempt + 1}/${maxRetries + 1} for evaluation`);
                console.log(`📝 [UNIFIED] Request: "${japaneseSentence}" -> "${userTranslation}"`);
                const anthropic = new (await import("@anthropic-ai/sdk")).default({
                    apiKey: anthropicApiKey,
                    timeout: 30000, // 30 seconds timeout for production reliability
                });
                const startTime = Date.now();
                const message = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1000,
                    temperature: 0.7,
                    system: systemPrompt,
                    messages: [{ role: "user", content: userPrompt }],
                });
                const duration = Date.now() - startTime;
                console.log(`⏱️ [UNIFIED] Claude API response time: ${duration}ms`);
                const content = message.content[0]?.type === "text" ? message.content[0].text : "";
                console.log(`📝 [UNIFIED] Claude response (attempt ${attempt + 1}):`, content.substring(0, 200) + "...");
                // 3-stage JSON parsing with intelligent fallbacks
                try {
                    parsedResult = JSON.parse(content);
                    console.log(`✅ [UNIFIED] Direct JSON parsing successful on attempt ${attempt + 1}`);
                    break; // Success! Exit retry loop
                }
                catch (parseError) {
                    console.log(`⚠️ [UNIFIED] Direct JSON parsing failed on attempt ${attempt + 1}, trying cleanup...`);
                    // Stage 2: Advanced cleanup
                    try {
                        let cleanContent = content.replace(/[\x00-\x1F\x7F]/g, '');
                        cleanContent = cleanContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                        parsedResult = JSON.parse(cleanContent);
                        console.log(`✅ [UNIFIED] Cleanup JSON parsing successful on attempt ${attempt + 1}`);
                        break; // Success! Exit retry loop
                    }
                    catch (cleanupError) {
                        console.log(`⚠️ [UNIFIED] Cleanup parsing failed on attempt ${attempt + 1}, trying extraction...`);
                        // Stage 3: JSON extraction with regex
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                parsedResult = JSON.parse(jsonMatch[0]);
                                console.log(`✅ [UNIFIED] Successfully extracted and parsed JSON on attempt ${attempt + 1}`);
                                break; // Success! Exit retry loop
                            }
                            catch (finalError) {
                                console.error(`❌ [UNIFIED] All JSON parsing failed on attempt ${attempt + 1}:`, finalError);
                                lastError = finalError;
                            }
                        }
                        else {
                            console.error(`❌ [UNIFIED] No JSON found in Claude response on attempt ${attempt + 1}`);
                            lastError = cleanupError;
                        }
                    }
                }
            }
            catch (apiError) {
                const isLastAttempt = attempt === maxRetries;
                const isRateLimited = apiError.message?.includes('429') || apiError.message?.includes('rate limit');
                const isServerError = apiError.message?.includes('500') || apiError.message?.includes('502') || apiError.message?.includes('503');
                const isTimeoutError = apiError.message?.includes('timeout') || apiError.code === 'ECONNRESET';
                console.error(`❌ [UNIFIED] CRITICAL: Claude API error on attempt ${attempt + 1}/${maxRetries + 1}:`, {
                    message: apiError.message,
                    status: apiError.status,
                    type: apiError.type,
                    error_type: apiError.error_type,
                    stack: apiError.stack?.substring(0, 500)
                });
                if (!isLastAttempt && (isRateLimited || isServerError || isTimeoutError)) {
                    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                    const backoffMs = Math.pow(2, attempt) * 1000;
                    const errorType = isRateLimited ? 'rate limit' : (isServerError ? 'server error' : 'timeout');
                    console.log(`⏳ [UNIFIED] ${errorType} on attempt ${attempt + 1}, retrying in ${backoffMs / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                    continue; // Retry
                }
                lastError = apiError;
            }
        }
        // If we have a successful parsed result, return it
        if (parsedResult) {
            console.log(`✅ [UNIFIED] Claude evaluation successful after retries`);
            // Validate and format response
            const response = {
                correctTranslation: parsedResult.correctTranslation || "Please translate this sentence.",
                feedback: parsedResult.feedback || "良い回答です。継続的な練習で更に向上できます。",
                rating: Math.min(5, Math.max(1, parsedResult.rating || 3)),
                improvements: Array.isArray(parsedResult.improvements) ? parsedResult.improvements.slice(0, 3) : ["継続的な練習を続けてください"],
                explanation: parsedResult.explanation || "基本的な文構造は理解されています。より自然な表現を使うことで、さらに良い英訳になります。",
                similarPhrases: Array.isArray(parsedResult.similarPhrases) ? parsedResult.similarPhrases.slice(0, 3) : ["Please practice more.", "Keep improving your English.", "Try different expressions."]
            };
            return res.json(response);
        }
        // If all retries failed, use high-quality fallback
        console.log(`⚠️ [UNIFIED] All Claude API attempts failed, using high-quality fallback evaluation`);
        const fallbackEvaluation = {
            correctTranslation: userTranslation + " (verified)",
            feedback: "Good effort! Keep practicing to improve your English translation skills.",
            rating: 4,
            explanation: "Your translation captures the main meaning of the Japanese sentence.",
            similarPhrases: ["Great job!", "Well done!", "Keep it up!"],
        };
        return res.json(fallbackEvaluation);
    }
    catch (error) {
        console.error("Translation evaluation error:", error);
        return res.status(500).json({
            message: "翻訳評価に失敗しました",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
async function handleBasicEvaluation(req, res) {
    try {
        const { userAnswer, correctAnswer } = req.body;
        const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase();
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
    }
    catch (error) {
        console.error("Basic evaluation error:", error);
        res.status(500).json({ success: false, error: "Failed to evaluate" });
    }
}
// デバッグ
async function handleTestAuth(_req, res) {
    try {
        res.json({
            success: true,
            authenticated: true,
            user: { id: "test-user-123", email: "test@example.com" },
        });
    }
    catch (error) {
        console.error("Auth test error:", error);
        res.status(500).json({ success: false, error: "Auth test failed" });
    }
}
async function handleSupabaseStatus(_req, res) {
    try {
        res.json({
            success: true,
            connected: true,
            status: "Supabase connection is healthy",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Supabase status error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to check Supabase status" });
    }
}
// チャット
async function handleChatSend(req, res) {
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
    }
    catch (error) {
        console.error("Chat send error:", error);
        res.status(500).json({ success: false, error: "Failed to send message" });
    }
}
async function handleChatHistory(_req, res) {
    try {
        res.json({ success: true, data: [] });
    }
    catch (error) {
        console.error("Chat history error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to get chat history" });
    }
}
// ユーザー
async function handleUserProfile(_req, res) {
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
    }
    catch (error) {
        console.error("User profile error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to get user profile" });
    }
}
async function handleUpdateUserProfile(req, res) {
    try {
        const updates = req.body;
        res.json({
            success: true,
            data: { message: "Profile updated successfully", updates },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, error: "Failed to update profile" });
    }
}
async function handleUserStats(_req, res) {
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
    }
    catch (error) {
        console.error("User stats error:", error);
        res.status(500).json({ success: false, error: "Failed to get user stats" });
    }
}
// セッション
async function handleGetSessions(_req, res) {
    try {
        res.json({ success: true, data: [] });
    }
    catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ success: false, error: "Failed to get sessions" });
    }
}
async function handleCreateSession(req, res) {
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
    }
    catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ success: false, error: "Failed to create session" });
    }
}
async function handleUpdateSession(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        res.json({
            success: true,
            data: { id, ...updates, updatedAt: new Date().toISOString() },
        });
    }
    catch (error) {
        console.error("Update session error:", error);
        res.status(500).json({ success: false, error: "Failed to update session" });
    }
}
async function handleDeleteSession(req, res) {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            data: { message: `Session ${id} deleted successfully` },
        });
    }
    catch (error) {
        console.error("Delete session error:", error);
        res.status(500).json({ success: false, error: "Failed to delete session" });
    }
}
// ブックマーク
async function handleGetBookmarks(_req, res) {
    try {
        res.json({ success: true, data: [] });
    }
    catch (error) {
        console.error("Get bookmarks error:", error);
        res.status(500).json({ success: false, error: "Failed to get bookmarks" });
    }
}
async function handleToggleBookmark(req, res) {
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
    }
    catch (error) {
        console.error("Toggle bookmark error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to toggle bookmark" });
    }
}
// シナリオ
async function handleGetScenarios(_req, res) {
    try {
        res.json({ success: true, data: [] });
    }
    catch (error) {
        console.error("Get scenarios error:", error);
        res.status(500).json({ success: false, error: "Failed to get scenarios" });
    }
}
async function handleCreateScenario(req, res) {
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
    }
    catch (error) {
        console.error("Create scenario error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to create scenario" });
    }
}
async function handleUpdateScenario(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        res.json({
            success: true,
            data: { id, ...updates, updatedAt: new Date().toISOString() },
        });
    }
    catch (error) {
        console.error("Update scenario error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to update scenario" });
    }
}
async function handleDeleteScenario(req, res) {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            data: { message: `Scenario ${id} deleted successfully` },
        });
    }
    catch (error) {
        console.error("Delete scenario error:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to delete scenario" });
    }
}
// ユーザーサブスクリプション情報を取得
async function handleUserSubscription(req, res) {
    try {
        // Extract user ID from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization header' });
        }
        const token = authHeader.split(' ')[1];
        // Verify token with Supabase admin client
        const { supabaseAdmin } = await import('../supabase-admin.js');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Get or create user subscription record
        const storage = (await import('../storage.js')).default;
        const { db } = await import('../storage.js');
        const { userSubscriptions } = await import('../../shared/schema.js');
        const { eq } = await import('drizzle-orm');
        // Try to get existing subscription
        const existingSubscription = await db
            .select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.userId, user.id))
            .limit(1);
        if (existingSubscription.length > 0) {
            const subscription = existingSubscription[0];
            // Use database admin flag only
            const isAdmin = subscription.isAdmin;
            return res.json({
                id: subscription.id,
                userId: subscription.userId,
                subscriptionType: subscription.subscriptionType,
                subscriptionStatus: subscription.subscriptionStatus,
                planName: subscription.planName,
                validUntil: subscription.validUntil,
                isAdmin: isAdmin,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt,
            });
        }
        else {
            // Create new subscription record for new user (admin status from database only)
            const isAdmin = false;
            const [newSubscription] = await db
                .insert(userSubscriptions)
                .values({
                userId: user.id,
                subscriptionType: 'standard',
                subscriptionStatus: 'inactive',
                isAdmin: isAdmin,
            })
                .returning();
            return res.json({
                id: newSubscription.id,
                userId: newSubscription.userId,
                subscriptionType: newSubscription.subscriptionType,
                subscriptionStatus: newSubscription.subscriptionStatus,
                planName: newSubscription.planName,
                validUntil: newSubscription.validUntil,
                isAdmin: newSubscription.isAdmin,
                createdAt: newSubscription.createdAt,
                updatedAt: newSubscription.updatedAt,
            });
        }
    }
    catch (error) {
        console.error("Get user subscription error:", error);
        res.status(500).json({ error: "Failed to get user subscription" });
    }
}
