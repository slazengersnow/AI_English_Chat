import { Router } from "express";
import { storage } from "./storage.js";
import { problemRequestSchema, translateRequestSchema, } from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
const router = Router();
// Session-based problem tracking
const sessionProblems = new Map();
function getSessionId(req) {
    return req.ip || "default";
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
    const availableProblems = problems.filter(p => !usedProblems.has(p));
    if (availableProblems.length === 0) {
        // Reset if all problems used
        usedProblems.clear();
        return problems[Math.floor(Math.random() * problems.length)];
    }
    return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}
// Problem generation handler
export const handleProblemGeneration = async (req, res) => {
    try {
        const canProceed = await storage.incrementDailyCount();
        if (!canProceed) {
            return res.status(429).json({
                message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
                dailyLimitReached: true,
            });
        }
        const parseResult = problemRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Invalid request data",
                details: parseResult.error.issues
            });
        }
        const { difficultyLevel } = parseResult.data;
        const userId = "bizmowa.com";
        const problemSets = {
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
        const allSentences = problemSets[difficultyLevel] || problemSets.toeic;
        const sessionId = getSessionId(req);
        const selectedSentence = getUnusedProblem(sessionId, allSentences);
        if (!selectedSentence) {
            return res.status(500).json({ message: "No problems available" });
        }
        markProblemAsUsed(sessionId, selectedSentence);
        const response = {
            japaneseSentence: selectedSentence,
            hints: [`問題 - ${difficultyLevel}`],
        };
        res.json(response);
    }
    catch (error) {
        console.error('Problem generation error:', error);
        res.status(400).json({
            message: "Invalid request data",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
// Claude evaluation handler
export const handleClaudeEvaluation = async (req, res) => {
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
        try {
            const anthropic = new Anthropic({ apiKey: anthropicApiKey });
            const message = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1000,
                temperature: 0.7,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            });
            const content = message.content[0].type === "text" ? message.content[0].text : "";
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
                    throw new Error("No valid JSON found in response");
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
            res.json(response);
        }
        catch (error) {
            console.error("Claude API error:", error);
            // Fallback response
            const fallbackResponse = {
                correctTranslation: `Your translation looks good. Keep practicing!`,
                feedback: `お疲れ様でした！「${userTranslation}」という回答をいただきました。現在AI評価システムに一時的な問題が発生していますが、継続して学習を続けることが大切です。`,
                rating: 3,
                improvements: [
                    "継続して練習を続けてください",
                    "様々な表現パターンを学習しましょう",
                ],
                explanation: "システム復旧中のため、詳細な評価ができません。学習を続けてください。",
                similarPhrases: [
                    "Keep up the good work!",
                    "Practice makes perfect.",
                ],
            };
            res.json(fallbackResponse);
        }
    }
    catch (error) {
        console.error("Evaluation error:", error);
        res.status(400).json({
            message: "Invalid request data",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
export function registerRoutes(app) {
    const router = Router();
    // Core API routes
    router.post("/problem", handleProblemGeneration);
    router.post("/evaluate-with-claude", handleClaudeEvaluation);
    // Mount all routes under /api
    app.use("/api", router);
}
