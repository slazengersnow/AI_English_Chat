"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClaudeEvaluation = exports.handleProblemGeneration = void 0;
exports.registerRoutes = registerRoutes;
var express_1 = require("express");
var storage_js_1 = require("./storage.js");
var schema_js_1 = require("../shared/schema.js");
var sdk_1 = require("@anthropic-ai/sdk");
var router = (0, express_1.Router)();
// Session-based problem tracking
var sessionProblems = new Map();
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
    var usedProblems = getUsedProblems(sessionId);
    usedProblems.add(problem);
}
function getUnusedProblem(sessionId, problems) {
    var usedProblems = getUsedProblems(sessionId);
    var availableProblems = problems.filter(function (p) { return !usedProblems.has(p); });
    if (availableProblems.length === 0) {
        // Reset if all problems used
        usedProblems.clear();
        return problems[Math.floor(Math.random() * problems.length)];
    }
    return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}
// Problem generation handler
var handleProblemGeneration = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var canProceed, parseResult, difficultyLevel, userId, problemSets, allSentences, sessionId, selectedSentence, response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.incrementDailyCount()];
            case 1:
                canProceed = _a.sent();
                if (!canProceed) {
                    return [2 /*return*/, res.status(429).json({
                            message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
                            dailyLimitReached: true,
                        })];
                }
                parseResult = schema_js_1.problemRequestSchema.safeParse(req.body);
                if (!parseResult.success) {
                    return [2 /*return*/, res.status(400).json({
                            message: "Invalid request data",
                            details: parseResult.error.issues
                        })];
                }
                difficultyLevel = parseResult.data.difficultyLevel;
                userId = "bizmowa.com";
                problemSets = {
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
                allSentences = problemSets[difficultyLevel] || problemSets.toeic;
                sessionId = getSessionId(req);
                selectedSentence = getUnusedProblem(sessionId, allSentences);
                if (!selectedSentence) {
                    return [2 /*return*/, res.status(500).json({ message: "No problems available" })];
                }
                markProblemAsUsed(sessionId, selectedSentence);
                response = {
                    japaneseSentence: selectedSentence,
                    hints: ["\u554F\u984C - ".concat(difficultyLevel)],
                };
                res.json(response);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Problem generation error:', error_1);
                res.status(400).json({
                    message: "Invalid request data",
                    error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleProblemGeneration = handleProblemGeneration;
// Claude evaluation handler
var handleClaudeEvaluation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, japaneseSentence, userTranslation, difficultyLevel, anthropicApiKey, systemPrompt, userPrompt, anthropic, message, content, parsedResult, jsonMatch, response, error_2, fallbackResponse, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = schema_js_1.translateRequestSchema.parse(req.body), japaneseSentence = _a.japaneseSentence, userTranslation = _a.userTranslation, difficultyLevel = _a.difficultyLevel;
                anthropicApiKey = process.env.ANTHROPIC_API_KEY;
                if (!anthropicApiKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Anthropic API key not configured" })];
                }
                systemPrompt = "\u3042\u306A\u305F\u306F\u65E5\u672C\u4EBA\u306E\u82F1\u8A9E\u5B66\u7FD2\u8005\u5411\u3051\u306E\u82F1\u8A9E\u6559\u5E2B\u3067\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u306E\u65E5\u672C\u8A9E\u304B\u3089\u82F1\u8A9E\u3078\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3001\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8FD4\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u91CD\u8981:\u3059\u3079\u3066\u306E\u8AAC\u660E\u3068\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306F\u5FC5\u305A\u65E5\u672C\u8A9E\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002\n\n{\n  \"correctTranslation\": \"\u6B63\u3057\u3044\u82F1\u8A33(\u30CD\u30A4\u30C6\u30A3\u30D6\u304C\u81EA\u7136\u306B\u4F7F\u3046\u8868\u73FE)\",\n  \"feedback\": \"\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF(\u826F\u3044\u70B9\u3068\u6539\u5584\u70B9\u3092\u65E5\u672C\u8A9E\u3067)\",\n  \"rating\": \u8A55\u4FA1(1=\u8981\u6539\u5584\u30015=\u5B8C\u74A7\u306E\u6570\u5024),\n  \"improvements\": [\"\u6539\u5584\u63D0\u68481(\u65E5\u672C\u8A9E\u3067)\", \"\u6539\u5584\u63D0\u68482(\u65E5\u672C\u8A9E\u3067)\"],\n  \"explanation\": \"\u6587\u6CD5\u3084\u8A9E\u5F59\u306E\u8A73\u3057\u3044\u89E3\u8AAC(\u5FC5\u305A\u65E5\u672C\u8A9E\u3067)\",\n  \"similarPhrases\": [\"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA1\", \"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA2\"]\n}\n\n\u8A55\u4FA1\u57FA\u6E96:\n- \u82F1\u6587\u306F\u30B7\u30F3\u30D7\u30EB\u3067\u5B9F\u7528\u7684(TOEIC700\u301C800\u30EC\u30D9\u30EB)\n- \u76F4\u8A33\u3067\u306F\u306A\u304F\u81EA\u7136\u306A\u82F1\u8A9E\n- feedback\u3001improvements\u3001explanation\u306F\u3059\u3079\u3066\u65E5\u672C\u8A9E\u3067\u8AAC\u660E\n- \u4E2D\u5B66\u751F\u3084\u9AD8\u6821\u751F\u306B\u3082\u5206\u304B\u308A\u3084\u3059\u3044\u65E5\u672C\u8A9E\u306E\u89E3\u8AAC";
                userPrompt = "\u65E5\u672C\u8A9E\u6587: ".concat(japaneseSentence, "\n\u30E6\u30FC\u30B6\u30FC\u306E\u82F1\u8A33: ").concat(userTranslation, "\n\n\u4E0A\u8A18\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                anthropic = new sdk_1.default({ apiKey: anthropicApiKey });
                return [4 /*yield*/, anthropic.messages.create({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1000,
                        temperature: 0.7,
                        system: systemPrompt,
                        messages: [{ role: "user", content: userPrompt }],
                    })];
            case 2:
                message = _b.sent();
                content = message.content[0].type === "text" ? message.content[0].text : "";
                parsedResult = void 0;
                try {
                    parsedResult = JSON.parse(content);
                }
                catch (parseError) {
                    jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsedResult = JSON.parse(jsonMatch[0]);
                    }
                    else {
                        throw new Error("No valid JSON found in response");
                    }
                }
                response = {
                    correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
                    feedback: parsedResult.feedback || "フィードバックの生成に失敗しました",
                    rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
                    improvements: parsedResult.improvements || [],
                    explanation: parsedResult.explanation || "",
                    similarPhrases: parsedResult.similarPhrases || [],
                };
                res.json(response);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error("Claude API error:", error_2);
                fallbackResponse = {
                    correctTranslation: "Your translation looks good. Keep practicing!",
                    feedback: "\u304A\u75B2\u308C\u69D8\u3067\u3057\u305F\uFF01\u300C".concat(userTranslation, "\u300D\u3068\u3044\u3046\u56DE\u7B54\u3092\u3044\u305F\u3060\u304D\u307E\u3057\u305F\u3002\u73FE\u5728AI\u8A55\u4FA1\u30B7\u30B9\u30C6\u30E0\u306B\u4E00\u6642\u7684\u306A\u554F\u984C\u304C\u767A\u751F\u3057\u3066\u3044\u307E\u3059\u304C\u3001\u7D99\u7D9A\u3057\u3066\u5B66\u7FD2\u3092\u7D9A\u3051\u308B\u3053\u3068\u304C\u5927\u5207\u3067\u3059\u3002"),
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
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                console.error("Evaluation error:", error_3);
                res.status(400).json({
                    message: "Invalid request data",
                    error: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.handleClaudeEvaluation = handleClaudeEvaluation;
function registerRoutes(app) {
    var router = (0, express_1.Router)();
    // Core API routes
    router.post("/problem", exports.handleProblemGeneration);
    router.post("/evaluate-with-claude", exports.handleClaudeEvaluation);
    // Mount all routes under /api
    app.use("/api", router);
}
