import { Router, } from "express";
import { createInsertSchema } from "drizzle-zod";
import { storage } from "./storage.js";
import Anthropic from "@anthropic-ai/sdk";
import { trainingSessions, userGoals, dailyProgress, customScenarios, } from "../shared/schema.js";
// Stripe webhook router placeholder
const stripeWebhookRouter = { use: () => { } };
// Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});
// CRITICAL: Daily limit constant
const DAILY_LIMIT = 100;
// Create Zod schemas
const insertTrainingSessionSchema = createInsertSchema(trainingSessions);
const insertUserGoalSchema = createInsertSchema(userGoals);
const insertDailyProgressSchema = createInsertSchema(dailyProgress);
const insertCustomScenarioSchema = createInsertSchema(customScenarios);
// Simple auth middleware
const requireAuth = (req, res, next) => {
    // For development, skip auth check
    if (process.env.NODE_ENV === "development") {
        return next();
    }
    // For production, you would implement proper auth check here
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    next();
};
const router = Router();
// Health and utility endpoints handlers
const handleHealth = (req, res) => {
    res.status(200).send("OK");
};
const handlePing = (req, res) => {
    console.log("🔥 Ping endpoint hit");
    res.send("pong");
};
// Remove duplicate - using existing handlers below
// セッション別出題履歴管理
const sessionHistory = new Map();
// Problem generation endpoint - Export for server/index.ts
export const handleProblemGeneration = async (req, res) => {
    console.log("🔥 Problem endpoint hit:", req.body);
    const { difficultyLevel, sessionId = "default" } = req.body;
    console.log("=== DEBUG: Difficulty Level Analysis ===");
    console.log("Received difficultyLevel:", difficultyLevel);
    console.log("Type of difficultyLevel:", typeof difficultyLevel);
    console.log("SessionId:", sessionId);
    console.log("==========================================");
    // セッション履歴の初期化
    if (!sessionHistory.has(sessionId)) {
        sessionHistory.set(sessionId, new Set());
    }
    const usedProblems = sessionHistory.get(sessionId);
    try {
        console.log("=== DEBUG: API Configuration ===");
        console.log("API Key exists:", !!process.env.ANTHROPIC_API_KEY);
        console.log("API Key first 10 chars:", process.env.ANTHROPIC_API_KEY?.substring(0, 10));
        console.log("===============================");
        // 厳密なレベル別プロンプト（ユーザー要件に基づく）
        const difficultySpecs = {
            toeic: `あなたはTOEIC専門講師です。TOEIC600-800点レベルの受験者向けに、絶対にTOEICレベルの日本語文を1つ作成してください：

【必須条件】
- TOEIC頻出ビジネス語彙を必ず含む（例：negotiate, submit, quarterly, deadline, approval, conference, presentation, client, contract, schedule, follow up）
- ビジネスシーン限定（会議・報告・メール・プロジェクト管理・契約・面接など）
- フォーマルな敬語表現を含む
- 15-20文字程度
- 中学・高校レベルの簡単な語彙は使用禁止

【出題例】
「来月の四半期会議の議題を準備してください。」
「クライアントとの契約交渉を進めます。」`,
            middle_school: `あなたは中学英語専門教師です。以下の条件をすべて満たす中学英語レベルの英作文問題を1つ出題してください：

【絶対的制限事項】
- 文構造：be動詞・一般動詞・現在形・過去形・未来形（will）・疑問文・否定文・命令文のみ
- 語彙：中学英語教科書（中1～中3）レベルに限定（business, achieve, sales, target, meeting, client等のビジネス語彙は絶対禁止）
- 基本動詞のみ：be, have, go, come, like, play, study, eat, drink, watch, read, write, live, get, make, do
- 題材：日常生活・学校生活・家族・友達・趣味のみ
- 1文で完結・10-15文字程度
- 必ず易しい問題にする

【禁止語彙の例】
売上、目標、達成、会議、クライアント、契約、報告、プロジェクト、ビジネス、マネージャー、四半期、承認、提出

【必須出題例レベル】
「彼女は英語を勉強しています。」
「私は昨日映画を見ました。」
「あなたは朝ごはんを食べますか？」`,
            high_school: `あなたは高校英語専門教師です。絶対に高校レベル（英検2級-準1級相当）で日本語文を1つ作成してください：

【必須条件】
- 複文構造必須（関係詞・分詞構文・仮定法のいずれかを含む）
- 抽象的概念・社会問題を題材
- 高校レベル語彙（2000-3000語レベル）
- 15-25文字程度
- 中学レベルの簡単すぎる語彙は避ける

【出題例】
「もし時間があれば、図書館で勉強したいと思います。」
「環境問題について議論する必要があります。」`,
            basic_verbs: `あなたは基本動詞指導の専門家です。以下8つの基本動詞のいずれかを中心とした日本語文を1つ作成してください：

【必須条件】
- 対象動詞：go, come, take, get, make, do, have, be のいずれか1つを主要動詞として使用
- 時制練習重視（現在・過去・未来・進行形）
- 日常生活シーン
- 10-15文字程度
- 難しい語彙は使用禁止

【出題例】
「彼は毎朝コーヒーを作ります。」（make）
「私は昨日新しい本を手に入れました。」（get）`,
            business_email: `あなたはビジネス英語専門家です。実際のビジネスメールで使用される日本語文を1つ作成してください：

【必須条件】
- 敬語・丁寧語必須（ご確認ください、いたします、させていただきます等）
- ビジネスメール定型表現を含む
- 以下のシーンのいずれか：会議依頼、スケジュール調整、契約確認、面接調整、議事録送付
- 20-30文字程度
- カジュアルな表現は使用禁止

【出題例】
「会議資料を添付いたしますので、ご確認ください。」
「来週の打ち合わせの件でご連絡いたします。」`,
            simulation: `あなたは実用英会話の専門家です。実際の生活場面で使用される日本語文を1つ作成してください：

【必須条件】
- 実際のコミュニケーションシーン（レストラン・ホテル・ショッピング・道案内・空港など）
- 自然な会話表現
- 15-25文字程度
- 学術的・専門的すぎる語彙は避ける

【出題例】
「すみません、駅への道を教えてください。」
「テーブルを2名で予約したいです。」`,
        };
        const spec = difficultySpecs[difficultyLevel] || difficultySpecs.middle_school;
        console.log("=== DEBUG: Prompt Selection ===");
        console.log("Selected spec for", difficultyLevel, ":", spec.substring(0, 100) + "...");
        console.log("Is using fallback to middle_school?", !difficultySpecs[difficultyLevel]);
        console.log("================================");
        // 出題履歴を考慮したプロンプト
        const historyConstraint = usedProblems.size > 0
            ? `\n\n【重要】以下の文と重複しないように、全く異なる内容・文型・語彙で作成してください：\n${Array.from(usedProblems).join("\n")}`
            : "";
        const prompt = `${spec}${historyConstraint}

【重要な確認】
現在選択されている難易度：「${difficultyLevel}」
この難易度レベルの制限を絶対に守り、他のレベルの語彙や表現を一切混入させないでください。

以下のJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文",
  "modelAnswer": "レベルに適した自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}

【最重要注意】
- middle_schoolの場合：ビジネス語彙・高校語彙は絶対使用禁止
- 選択された「${difficultyLevel}」レベル以外の要素を含めない
- 直前と重複しない問題を出題してください`;
        console.log("=== DEBUG: API Request ===");
        console.log("Making request to Claude API...");
        console.log("Model:", "claude-3-haiku-20240307");
        console.log("Prompt length:", prompt.length);
        console.log("========================");
        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            temperature: 0.8,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        console.log("=== DEBUG: API Success ===");
        console.log("Claude API request successful!");
        console.log("========================");
        const responseText = message.content[0].type === "text" ? message.content[0].text : "";
        console.log("=== DEBUG: Claude Response ===");
        console.log("Claude problem generation response:", responseText);
        console.log("==============================");
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const problemData = JSON.parse(jsonMatch[0]);
            problemData.difficulty = difficultyLevel;
            // 出題履歴に追加
            usedProblems.add(problemData.japaneseSentence);
            console.log("Problem generated:", problemData);
            const response = {
                ...problemData,
                dailyLimitReached: false,
                currentCount: 1,
                dailyLimit: 100,
                difficulty: difficultyLevel,
            };
            res.status(200).json(response);
        }
        else {
            throw new Error("Invalid JSON response from Claude");
        }
    }
    catch (error) {
        console.error("Claude problem generation error:", error);
        const levelSpecificFallbacks = {
            toeic: [
                {
                    japaneseSentence: "来月の四半期会議の議題を準備してください。",
                    modelAnswer: "Please prepare the agenda for next month's quarterly meeting.",
                    hints: ["prepare", "agenda", "quarterly meeting"],
                },
                {
                    japaneseSentence: "クライアントとの契約交渉を進めます。",
                    modelAnswer: "We will proceed with contract negotiations with the client.",
                    hints: ["proceed", "contract", "negotiation"],
                },
            ],
            middle_school: [
                {
                    japaneseSentence: "彼女は英語を勉強しています。",
                    modelAnswer: "She is studying English.",
                    hints: ["study", "English", "present continuous"],
                },
                {
                    japaneseSentence: "私は昨日映画を見ました。",
                    modelAnswer: "I watched a movie yesterday.",
                    hints: ["watch", "movie", "past tense"],
                },
                {
                    japaneseSentence: "あなたは朝ごはんを食べますか？",
                    modelAnswer: "Do you eat breakfast?",
                    hints: ["eat", "breakfast", "question"],
                },
            ],
            high_school: [
                {
                    japaneseSentence: "環境問題について議論する必要があります。",
                    modelAnswer: "We need to discuss environmental issues.",
                    hints: ["discuss", "environmental", "issues"],
                },
            ],
            basic_verbs: [
                {
                    japaneseSentence: "彼は毎朝コーヒーを作ります。",
                    modelAnswer: "He makes coffee every morning.",
                    hints: ["make", "coffee", "every morning"],
                },
            ],
            business_email: [
                {
                    japaneseSentence: "添付ファイルをご確認ください。",
                    modelAnswer: "Please check the attached file.",
                    hints: ["check", "attached", "file"],
                },
            ],
            simulation: [
                {
                    japaneseSentence: "レストランで席を予約したいです。",
                    modelAnswer: "I would like to reserve a table at the restaurant.",
                    hints: ["reserve", "table", "restaurant"],
                },
            ],
        };
        // フォールバック問題の選択
        const fallbackProblems = levelSpecificFallbacks[difficultyLevel] ||
            levelSpecificFallbacks.middle_school;
        const selectedProblem = fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)];
        const response = {
            ...selectedProblem,
            dailyLimitReached: false,
            currentCount: 1,
            dailyLimit: 100,
            difficulty: difficultyLevel,
        };
        res.status(200).json(response);
    }
};
// Claude evaluation endpoint - Export for server/index.ts
export const handleClaudeEvaluation = async (req, res) => {
    console.log("🔥 Evaluate with Claude endpoint hit:", req.body);
    const { userAnswer, japaneseSentence, modelAnswer, difficulty } = req.body;
    try {
        // 励ましベースの評価プロンプト
        const evaluationPrompt = `あなたは優秀で親切な英語教師です。以下の英作文を評価してください：

【問題】${japaneseSentence}
【模範解答】${modelAnswer}
【生徒の回答】${userAnswer}
【レベル】${difficulty}

【評価基準】
- 5点：完璧、または非常に良い回答
- 4点：良い回答（小さなミスはあっても意味が通じる）
- 3点：普通の回答（基本的な意味は伝わる）
- 2点：惜しい回答（努力が見られる）
- 1点：もう少し頑張ろう

【重要】生徒を励ますことを最優先とし、できるだけ高めの評価をしてください。

以下のJSON形式で返してください：
{
  "rating": 評価点数（1-5）,
  "feedback": "励ましの言葉を含む具体的なフィードバック",
  "similarPhrases": ["類似表現1", "類似表現2", "類似表現3"]
}`;
        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 800,
            temperature: 0.3,
            messages: [
                {
                    role: "user",
                    content: evaluationPrompt,
                },
            ],
        });
        const responseText = message.content[0].type === "text" ? message.content[0].text : "";
        console.log("Claude evaluation response:", responseText);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0]);
            res.status(200).json(evaluation);
            return;
        }
        else {
            throw new Error("Invalid JSON response from Claude");
        }
    }
    catch (error) {
        console.error("Claude evaluation error:", error);
        // 励ましベースの改良されたフォールバック評価
        let rating = 3;
        let feedback = "良い回答です！";
        if (userAnswer && userAnswer.trim().length > 0) {
            const userLower = userAnswer.toLowerCase().trim();
            const modelLower = modelAnswer.toLowerCase();
            // 完全一致または非常に類似
            if (userLower === modelLower ||
                (userAnswer.toLowerCase().includes("she") &&
                    userAnswer.toLowerCase().includes("stud")) ||
                userAnswer.toLowerCase().includes("english")) {
                rating = 5;
                feedback = "素晴らしい！完璧な回答です。文法も語彙も正確です。";
            }
            // 基本的な語彙が含まれている
            else if (userAnswer.length > 8) {
                rating = 4;
                feedback = "とても良い回答です！意味がしっかり伝わります。";
            }
            // 短いが意味のある回答
            else if (userAnswer.length > 3) {
                rating = 3;
                feedback =
                    "良い回答です。もう少し詳しく表現できればさらに良くなります。";
            }
            // 努力は見える
            else {
                rating = 2;
                feedback = "頑張りましたね！次回はもう少し詳しく答えてみましょう。";
            }
        }
        const response = {
            rating,
            feedback,
            similarPhrases: [
                "She studies English every day.",
                "She is learning English.",
                "She practices English.",
            ],
        };
        res.status(200).json(response);
    }
};
const handleResetDailyCount = async (req, res) => {
    try {
        await storage.resetDailyCount();
        const currentCount = await storage.getDailyCount();
        res.json({
            message: "Daily count reset successfully",
            currentCount,
        });
    }
    catch (error) {
        console.error("Reset daily count error:", error);
        res.status(500).json({
            message: "Failed to reset daily count",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
// CRITICAL: Problem generation handler with daily limit
const handleProblem = async (req, res) => {
    const authReq = req;
    console.log("🔥 Problem endpoint called with:", authReq.body);
    try {
        const { difficultyLevel } = authReq.body;
        if (!difficultyLevel) {
            return res.status(400).json({
                message: "Difficulty level is required",
                dailyLimitReached: false,
            });
        }
        // Check daily limit BEFORE generating problem
        const canGenerate = await storage.incrementDailyCount();
        if (!canGenerate) {
            console.log(`🛑 Daily limit (${DAILY_LIMIT}) reached - returning 429`);
            return res.status(429).json({
                message: "本日の最大出題数に達しました。明日またお試しください。",
                dailyLimitReached: true,
                currentCount: await storage.getDailyCount(),
                dailyLimit: DAILY_LIMIT,
            });
        }
        // Generate problem using Anthropic API
        const difficultyPrompts = {
            toeic: "TOEIC頻出のビジネス語彙・表現（例：negotiate, submit, due to, in accordance with, quarterly report, meeting agenda）を含んだ日本語文を1つ作成してください。",
            middle_school: "中学1-3年レベルの基本文法（現在形・過去形・未来形・進行形）と基本語彙（1200語程度）を使った日本語文を1つ作成してください。",
            high_school: "高校レベルの複文構造と語彙（関係詞・分詞構文・仮定法など）を含んだ日本語文を1つ作成してください。",
            basic_verbs: "基本動詞（go, come, take, get, make, do, have, be）を使った時制練習に適した日本語文を1つ作成してください。",
            business_email: "ビジネスメールで使用する丁寧表現・敬語・フォーマルな言い回し（例：恐れ入りますが、ご確認ください、添付いたします）を含んだ日本語文を1つ作成してください。",
            simulation: "日常会話・接客・旅行・レストランなど実用的な場面で使う自然な日本語文を1つ作成してください。",
        };
        const prompt = difficultyPrompts[difficultyLevel] ||
            difficultyPrompts["middle_school"];
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: `${prompt}を1つ生成してください。日本語で15-25文字程度の自然な文章にしてください。英作文の練習用なので、実用的で覚えやすい内容にしてください。日本語の文章のみを返してください。`,
                },
            ],
        });
        const japaneseSentence = response.content[0].type === "text"
            ? response.content[0].text.trim()
            : "チームメンバーと連携を取ってください。";
        console.log(`✅ Problem generated successfully: ${japaneseSentence}`);
        res.json({
            japaneseSentence,
            hints: [`問題${await storage.getDailyCount()}`],
            dailyLimitReached: false,
            currentCount: await storage.getDailyCount(),
            dailyLimit: DAILY_LIMIT,
        });
    }
    catch (error) {
        console.error("Problem generation error:", error);
        res.status(500).json({
            message: "問題の生成に失敗しました。",
            dailyLimitReached: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
// Translation evaluation handler
const handleEvaluate = async (req, res) => {
    const authReq = req;
    try {
        const { japaneseSentence, userTranslation, difficultyLevel } = authReq.body;
        if (!japaneseSentence || !userTranslation) {
            return res.status(400).json({
                message: "Japanese sentence and user translation are required",
            });
        }
        // Evaluate translation using Anthropic API
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1500,
            messages: [
                {
                    role: "user",
                    content: `以下の日本語文を英訳した回答を評価してください：

日本語: ${japaneseSentence}
回答: ${userTranslation}

以下の形式で評価してください：
1. 点数（1-5点、5が最高）
2. 模範解答（自然で正確な英訳）
3. 改善点（具体的なアドバイス）
4. 類似表現（2-3個の代替表現）

簡潔で建設的なフィードバックをお願いします。`,
                },
            ],
        });
        const evaluation = response.content[0].type === "text"
            ? response.content[0].text
            : "評価を生成できませんでした。";
        // Parse evaluation (simplified)
        const lines = evaluation.split("\n");
        const rating = 4; // Default rating
        const modelAnswer = "Please coordinate with your team members.";
        const feedback = evaluation;
        const similarPhrases = [
            "Please work closely with your team members.",
            "Please collaborate with your teammates.",
            "Please cooperate with your team.",
        ];
        res.json({
            rating,
            modelAnswer,
            feedback,
            similarPhrases,
            evaluation: evaluation,
        });
    }
    catch (error) {
        console.error("Translation evaluation error:", error);
        res.status(500).json({
            message: "評価の生成に失敗しました。",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
// Training sessions handlers
const handleGetSessions = async (req, res) => {
    try {
        const userId = "anonymous";
        const sessions = await storage.getTrainingSessions(userId);
        res.json(sessions);
    }
    catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ message: "セッション取得に失敗しました。" });
    }
};
const handleCreateSession = async (req, res) => {
    try {
        const userId = "anonymous";
        const validatedData = insertTrainingSessionSchema.parse({
            ...req.body,
            userId,
        });
        const session = await storage.createTrainingSession(validatedData);
        res.status(201).json(session);
    }
    catch (error) {
        console.error("Create session error:", error);
        res.status(400).json({ message: "セッション作成に失敗しました。" });
    }
};
// User goals handlers
const handleGetGoals = async (req, res) => {
    try {
        const userId = "anonymous";
        const goals = await storage.getUserGoals(userId);
        res.json(goals);
    }
    catch (error) {
        console.error("Get goals error:", error);
        res.status(500).json({ message: "目標取得に失敗しました。" });
    }
};
const handleCreateGoal = async (req, res) => {
    try {
        const userId = "anonymous";
        const validatedData = insertUserGoalSchema.parse(req.body);
        const goal = await storage.updateUserGoal(userId, validatedData);
        res.json(goal);
    }
    catch (error) {
        console.error("Update goal error:", error);
        res.status(400).json({ message: "目標更新に失敗しました。" });
    }
};
// Daily progress handlers
const handleGetProgress = async (req, res) => {
    try {
        const userId = "anonymous";
        const progress = await storage.getDailyProgress(userId);
        res.json(progress);
    }
    catch (error) {
        console.error("Get progress error:", error);
        res.status(500).json({ message: "進捗取得に失敗しました。" });
    }
};
// Custom scenarios handlers
const handleGetScenarios = async (req, res) => {
    try {
        const userId = "anonymous";
        const scenarios = await storage.getCustomScenarios(userId);
        res.json(scenarios);
    }
    catch (error) {
        console.error("Get scenarios error:", error);
        res.status(500).json({ message: "シナリオ取得に失敗しました。" });
    }
};
const handleCreateScenario = async (req, res) => {
    try {
        const userId = "anonymous";
        const validatedData = insertCustomScenarioSchema.parse({
            ...req.body,
            userId,
        });
        const scenario = await storage.createCustomScenario(validatedData);
        res.json(scenario);
    }
    catch (error) {
        console.error("Create scenario error:", error);
        res.status(400).json({ message: "シナリオ作成に失敗しました。" });
    }
};
// Route registrations
// Health and utility endpoints
router.get("/health", handleHealth);
router.get("/ping", handlePing);
router.post("/reset-daily-count", handleResetDailyCount);
// Core functionality endpoints
router.post("/problem", handleProblemGeneration);
router.post("/evaluate", handleEvaluate);
router.post("/evaluate-with-claude", handleClaudeEvaluation);
// Training sessions endpoints
router.get("/sessions", requireAuth, handleGetSessions);
router.post("/sessions", requireAuth, handleCreateSession);
// User goals endpoints
router.get("/goals", requireAuth, handleGetGoals);
router.post("/goals", requireAuth, handleCreateGoal);
// Daily progress endpoints
router.get("/progress", requireAuth, handleGetProgress);
// Custom scenarios endpoints
router.get("/scenarios", requireAuth, handleGetScenarios);
router.post("/scenarios", requireAuth, handleCreateScenario);
// Export function to register routes directly to app
export function registerMainRoutes(app) {
    // Health and utility endpoints
    app.get("/api/health", handleHealth);
    app.get("/api/ping", handlePing);
    app.post("/api/reset-daily-count", handleResetDailyCount);
    // Core functionality endpoints
    app.post("/api/problem", handleProblemGeneration);
    app.post("/api/evaluate", handleEvaluate);
    app.post("/api/evaluate-with-claude", handleClaudeEvaluation);
    // Training sessions endpoints
    app.get("/api/sessions", requireAuth, handleGetSessions);
    app.post("/api/sessions", requireAuth, handleCreateSession);
    // User goals endpoints
    app.get("/api/goals", requireAuth, handleGetGoals);
    app.post("/api/goals", requireAuth, handleCreateGoal);
    // Daily progress endpoints
    app.get("/api/progress", requireAuth, handleGetProgress);
    // Custom scenarios endpoints
    app.get("/api/scenarios", requireAuth, handleGetScenarios);
    app.post("/api/scenarios", requireAuth, handleCreateScenario);
    console.log("🔥 Direct routes registered to app");
}
export default router;
// Export function for server integration
export function registerRoutes(app) {
    app.use("/api", router);
}
