import { Router } from "express";
import storage from "./storage.js";
import { problemRequestSchema, translateRequestSchema, } from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
const router = Router();
/* -------------------- セッション重複防止 -------------------- */
const sessionProblems = new Map();
function getSessionId(req) {
    // 同一セッションでの重複出題を抑えるための簡易ID
    return req.headers["x-session-id"] || req.ip || "default";
}
function getUsedProblems(sessionId) {
    if (!sessionProblems.has(sessionId)) {
        sessionProblems.set(sessionId, new Set());
    }
    return sessionProblems.get(sessionId);
}
function markProblemAsUsed(sessionId, problem) {
    getUsedProblems(sessionId).add(problem);
}
function getUnusedProblem(sessionId, problems) {
    const used = getUsedProblems(sessionId);
    const pool = problems.filter((p) => !used.has(p));
    if (pool.length === 0) {
        // 使い切ったらリセット
        used.clear();
        return problems[Math.floor(Math.random() * problems.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}
/* -------------------- 入力の正規化ヘルパ -------------------- */
const DIFFICULTY_ALIASES = {
    // 受け取った値 → 正規化後キー
    toeic: "toeic",
    middle_school: "middle-school",
    "middle-school": "middle-school",
    high_school: "high-school",
    "high-school": "high-school",
    basic_verbs: "basic-verbs",
    "basic-verbs": "basic-verbs",
    business_email: "business-email",
    "business-email": "business-email",
    simulation: "simulation",
};
function normalizeDifficulty(input) {
    if (!input)
        return undefined;
    const lowered = input.toLowerCase();
    const replaced = lowered.replace(/_/g, "-");
    return (DIFFICULTY_ALIASES[lowered] || DIFFICULTY_ALIASES[replaced] || undefined);
}
function extractDifficultyLevel(body) {
    // 両方の名前に対応（difficultyLevel / difficulty）
    return normalizeDifficulty(body?.difficultyLevel ?? body?.difficulty);
}
function extractUserTranslation(body) {
    // 両方の名前に対応（userTranslation / userAnswer）
    return body?.userTranslation ?? body?.userAnswer ?? body?.answer;
}
/* -------------------- 出題セット -------------------- */
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
/* -------------------- 問題出題 -------------------- */
export const handleProblemGeneration = async (req, res) => {
    try {
        const canProceed = await storage.incrementDailyCount();
        if (!canProceed) {
            return res.status(429).json({
                message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
                dailyLimitReached: true,
            });
        }
        // ★ まずは正規化してから Zod 検証に渡す
        const normalized = {
            difficultyLevel: extractDifficultyLevel(req.body),
        };
        if (!normalized.difficultyLevel) {
            return res.status(400).json({
                message: "Invalid request data",
                hint: "difficulty / difficultyLevel のどちらかでレベルを指定してください（例: 'middle_school' または 'middle-school'）。",
            });
        }
        const parseResult = problemRequestSchema.safeParse(normalized);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Invalid request data",
                details: parseResult.error.issues,
            });
        }
        const { difficultyLevel } = parseResult.data;
        const allSentences = problemSets[difficultyLevel] || problemSets["toeic"];
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
        console.error("Problem generation error:", error);
        res.status(500).json({
            message: "Problem generation failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
/* -------------------- Claude 評価 -------------------- */
export const handleClaudeEvaluation = async (req, res) => {
    try {
        // ★ まずは正規化
        const normalized = {
            japaneseSentence: req.body?.japaneseSentence,
            userTranslation: extractUserTranslation(req.body),
            difficultyLevel: extractDifficultyLevel(req.body),
        };
        const result = translateRequestSchema.safeParse(normalized);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid request data",
                error: result.error.issues,
            });
        }
        const { japaneseSentence, userTranslation } = result.data;
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
}`;
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
            const content = message.content[0]?.type === "text" ? message.content[0].text : "";
            let parsedResult;
            try {
                parsedResult = JSON.parse(content);
            }
            catch {
                const jsonMatch = content?.match?.(/\{[\s\S]*\}/);
                parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
            }
            const response = {
                correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
                feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
                rating: Math.max(1, Math.min(5, Number(parsedResult.rating) || 3)),
                improvements: Array.isArray(parsedResult.improvements)
                    ? parsedResult.improvements
                    : [],
                explanation: parsedResult.explanation || "",
                similarPhrases: Array.isArray(parsedResult.similarPhrases)
                    ? parsedResult.similarPhrases
                    : [],
            };
            res.json(response);
        }
        catch (error) {
            console.error("Claude API error:", error);
            // Fallback
            const fallback = {
                correctTranslation: "Please coordinate with your team members.",
                feedback: `お疲れ様でした！「${normalized.userTranslation ?? ""}」という回答をいただきました。現在AI評価システムに一時的な問題が発生していますが、継続して学習を続けましょう。`,
                rating: 3,
                improvements: [
                    "短く自然な表現を意識しましょう",
                    "動詞と時制の一致を確認しましょう",
                ],
                explanation: "システム復旧中のため、詳細な評価ができません。",
                similarPhrases: [
                    "Work closely with your teammates.",
                    "Collaborate with your team.",
                ],
            };
            res.json(fallback);
        }
    }
    catch (error) {
        console.error("Evaluation error:", error);
        res.status(500).json({
            message: "Evaluation failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
/* -------------------- ルーティング登録 -------------------- */
export function registerRoutes(app) {
    const router = Router();
    router.post("/problem", handleProblemGeneration);
    router.post("/evaluate-with-claude", handleClaudeEvaluation);
    app.use("/api", router);
}
