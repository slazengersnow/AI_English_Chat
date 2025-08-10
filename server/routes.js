"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.handleStripeWebhook = exports.handleUpdateUserSubscription = exports.handleAdminExport = exports.handleGetAdminAnalytics = exports.handleGetAdminUsers = exports.handleGetAdminStats = exports.handleResetUserData = exports.handleUpgradeSubscription = exports.handleGetSubscriptionDetails = exports.handleCreateCustomerPortal = exports.handleCreateSubscription = exports.handleEmergencyReset = exports.handleResetDailyCount = exports.handleGetDailyCount = exports.handleSimulationTranslate = exports.handleGetSimulationProblem = exports.handleGetCustomScenario = exports.handleDeleteCustomScenario = exports.handleUpdateCustomScenario = exports.handleCreateCustomScenario = exports.handleGetCustomScenarios = exports.handleUpdateReviewCount = exports.handleUpdateBookmark = exports.handleGetBookmarkedSessions = exports.handleGetRecentSessions = exports.handleGetReviewSessions = exports.handleGetMonthlyStats = exports.handleGetDifficultyStats = exports.handleGetStreak = exports.handleGetProgress = exports.handleUpdateUserGoals = exports.handleGetUserGoals = exports.handleGetSessionsByDifficulty = exports.handleGetSessions = exports.handleCreateCheckoutSession = exports.handleSavePriceConfiguration = exports.handleStripePriceInfo = exports.handleGetSubscriptionPlans = exports.handleGetStripePrices = exports.handleClaudeEvaluation = exports.handleProblemGeneration = exports.handleGetUserSubscription = exports.handleLogin = exports.handleSignup = exports.handleEcho = exports.handlePing = exports.handleHealth = exports.requirePremiumSubscription = exports.requireActiveSubscription = void 0;
var storage_js_1 = require("./storage.js");
var stripe_1 = require("stripe");
var sdk_1 = require("@anthropic-ai/sdk");
var schema_js_1 = require("../shared/schema.js");
// セッションベースの問題追跡（重複防止用）
var sessionProblems = new Map();
// ヘルパー関数
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
    var usedProblems = getUsedProblems(sessionId);
    usedProblems.add(problem);
}
function getUnusedProblem(sessionId, problems) {
    var usedProblems = getUsedProblems(sessionId);
    var availableProblems = problems.filter(function (p) { return !usedProblems.has(p); });
    if (availableProblems.length === 0) {
        sessionProblems.delete(sessionId);
        return problems[Math.floor(Math.random() * problems.length)];
    }
    return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}
// 価格設定
var priceConfig = {
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
function getPlanTypeFromPriceId(priceId) {
    var currentMode = process.env.STRIPE_MODE || "test";
    var currentPrices = priceConfig[currentMode];
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
// ============================================================================
// ミドルウェア関数
// ============================================================================
var requireActiveSubscription = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, userId, token, payload, userEmail, subscription, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authHeader = req.headers.authorization;
                userId = "bizmowa.com";
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                    try {
                        payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
                        if (payload.email) {
                            userId = payload.email;
                        }
                    }
                    catch (jwtError) {
                        console.log("JWT parsing failed, using fallback:", jwtError);
                        userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                        if (userEmail) {
                            userId = userEmail;
                        }
                    }
                }
                console.log("Checking subscription for user:", userId);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription(userId)];
            case 1:
                subscription = _a.sent();
                if (!subscription ||
                    !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
                    console.log("No valid subscription found for user:", userId);
                    return [2 /*return*/, res.status(403).json({
                            message: "アクティブなサブスクリプションが必要です",
                            needsSubscription: true,
                        })];
                }
                console.log("Valid subscription found:", subscription);
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Subscription check error:", error_1);
                res
                    .status(500)
                    .json({ message: "サブスクリプション確認中にエラーが発生しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.requireActiveSubscription = requireActiveSubscription;
var requirePremiumSubscription = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userEmail, userId, subscription, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                userId = "bizmowa.com";
                if (userEmail) {
                    userId = userEmail;
                }
                console.log("Checking premium subscription for user:", userId);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription(userId)];
            case 1:
                subscription = _a.sent();
                if (!subscription ||
                    subscription.subscriptionType !== "premium" ||
                    !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
                    console.log("No valid premium subscription found for user:", userId);
                    return [2 /*return*/, res.status(403).json({
                            message: "プレミアムプランが必要です",
                            needsPremium: true,
                        })];
                }
                console.log("Valid premium subscription found:", subscription);
                next();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Premium subscription check error:", error_2);
                res
                    .status(500)
                    .json({ message: "プレミアムサブスクリプションの確認に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.requirePremiumSubscription = requirePremiumSubscription;
// ============================================================================
// 基本エンドポイント
// ============================================================================
var handleHealth = function (req, res) {
    res.status(200).send("OK");
};
exports.handleHealth = handleHealth;
var handlePing = function (req, res) {
    res.send("pong");
};
exports.handlePing = handlePing;
var handleEcho = function (req, res) {
    var sessionId = getSessionId(req);
    res.json({ sessionId: sessionId, data: req.body });
};
exports.handleEcho = handleEcho;
// ============================================================================
// 認証関連
// ============================================================================
var handleSignup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, storage_js_1.storage.updateUserSubscription("default_user", {
                        subscriptionStatus: "inactive",
                        userId: "default_user",
                    })];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: "アカウントが作成されました",
                    needsSubscription: true,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error("Signup error:", error_3);
                res.status(400).json({ message: "アカウント作成に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleSignup = handleSignup;
var handleLogin = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, subscription, needsSubscription, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                subscription = _b.sent();
                needsSubscription = !subscription ||
                    !["active", "trialing"].includes(subscription.subscriptionStatus || "");
                res.json({
                    success: true,
                    message: "ログインしました",
                    needsSubscription: needsSubscription,
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error("Login error:", error_4);
                res.status(400).json({ message: "ログインに失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleLogin = handleLogin;
var handleGetUserSubscription = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, userId, token, payload, userEmail, subscription, defaultSubscription, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                authHeader = req.headers.authorization;
                userId = "bizmowa.com";
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                    try {
                        payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
                        if (payload.email) {
                            userId = payload.email;
                        }
                    }
                    catch (jwtError) {
                        console.log("JWT parsing failed, using fallback:", jwtError);
                        userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                        if (userEmail) {
                            userId = userEmail;
                        }
                    }
                }
                console.log("Getting subscription for user:", userId);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription(userId)];
            case 1:
                subscription = _a.sent();
                if (!!subscription) return [3 /*break*/, 3];
                console.log("No subscription found, creating default for user:", userId);
                return [4 /*yield*/, storage_js_1.storage.updateUserSubscription(userId, {
                        subscriptionStatus: "inactive",
                        subscriptionType: "standard",
                        userId: userId,
                        isAdmin: userId === "slazengersnow@gmail.com",
                    })];
            case 2:
                defaultSubscription = _a.sent();
                return [2 /*return*/, res.json(defaultSubscription)];
            case 3:
                console.log("Found subscription:", subscription);
                res.json(subscription);
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                console.error("User subscription error:", error_5);
                res.status(500).json({
                    message: "サブスクリプション情報の取得に失敗しました",
                    error: error_5.message,
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.handleGetUserSubscription = handleGetUserSubscription;
// ============================================================================
// 問題生成
// ============================================================================
var handleProblemGeneration = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var canProceed, parseResult, difficultyLevel, userId, previousProblems, attemptedSentences_1, problemSets, allSentences, availableSentences, sentences, sessionId, selectedSentence, response, _a, error_6;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                console.log("Problem generation request body:", req.body);
                return [4 /*yield*/, storage_js_1.storage.incrementDailyCount()];
            case 1:
                canProceed = _c.sent();
                if (!canProceed) {
                    return [2 /*return*/, res.status(429).json({
                            message: "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
                            dailyLimitReached: true,
                        })];
                }
                parseResult = schema_js_1.problemRequestSchema.safeParse(req.body);
                if (!parseResult.success) {
                    console.error("Schema validation failed:", parseResult.error);
                    return [2 /*return*/, res.status(400).json({
                            message: "Invalid request data",
                            details: parseResult.error.issues,
                        })];
                }
                difficultyLevel = parseResult.data.difficultyLevel;
                console.log("Schema validation passed, difficultyLevel:", difficultyLevel);
                userId = "bizmowa.com";
                console.log("Fetching previous problems for user:", userId);
                return [4 /*yield*/, storage_js_1.storage.getUserAttemptedProblems(difficultyLevel, userId)];
            case 2:
                previousProblems = _c.sent();
                console.log("Previous problems fetched, count:", previousProblems.length);
                attemptedSentences_1 = new Set(previousProblems.map(function (p) { return p.japaneseSentence; }));
                console.log("Attempted sentences set created, size:", attemptedSentences_1.size);
                problemSets = {
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
                allSentences = problemSets[difficultyLevel];
                availableSentences = allSentences.filter(function (sentence) { return !attemptedSentences_1.has(sentence); });
                sentences = availableSentences.length > 0 ? availableSentences : allSentences;
                sessionId = getSessionId(req);
                selectedSentence = getUnusedProblem(sessionId, sentences);
                if (!selectedSentence) {
                    return [2 /*return*/, res.status(500).json({ message: "No problems available" })];
                }
                markProblemAsUsed(sessionId, selectedSentence);
                _b = {
                    japaneseSentence: selectedSentence
                };
                _a = "\u554F\u984C".concat;
                return [4 /*yield*/, storage_js_1.storage.getCurrentProblemNumber(userId, difficultyLevel)];
            case 3:
                response = (_b.hints = [
                    _a.apply("\u554F\u984C", [_c.sent()])
                ],
                    _b);
                res.json(response);
                return [3 /*break*/, 5];
            case 4:
                error_6 = _c.sent();
                console.error("Problem generation error:", error_6);
                res.status(400).json({
                    message: "Invalid request data",
                    error: error_6 instanceof Error ? error_6.message : "Unknown error",
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.handleProblemGeneration = handleProblemGeneration;
// ============================================================================
// Claude評価
// ============================================================================
var handleClaudeEvaluation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, japaneseSentence, userTranslation, difficultyLevel, anthropicApiKey, systemPrompt, userPrompt, anthropic, message, content, responseText, parsedResult, jsonMatch, response, userEmail, userId, trainingSession, currentProblemNumber, sdkError_1, basicResponse, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                _a = schema_js_1.translateRequestSchema.parse(req.body), japaneseSentence = _a.japaneseSentence, userTranslation = _a.userTranslation, difficultyLevel = _a.difficultyLevel;
                anthropicApiKey = process.env.ANTHROPIC_API_KEY;
                if (!anthropicApiKey) {
                    return [2 /*return*/, res
                            .status(500)
                            .json({ message: "Anthropic API key not configured" })];
                }
                systemPrompt = "\u3042\u306A\u305F\u306F\u65E5\u672C\u4EBA\u306E\u82F1\u8A9E\u5B66\u7FD2\u8005\u5411\u3051\u306E\u82F1\u8A9E\u6559\u5E2B\u3067\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u306E\u65E5\u672C\u8A9E\u304B\u3089\u82F1\u8A9E\u3078\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3001\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8FD4\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u91CD\u8981:\u3059\u3079\u3066\u306E\u8AAC\u660E\u3068\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306F\u5FC5\u305A\u65E5\u672C\u8A9E\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002\n\n{\n  \"correctTranslation\": \"\u6B63\u3057\u3044\u82F1\u8A33(\u30CD\u30A4\u30C6\u30A3\u30D6\u304C\u81EA\u7136\u306B\u4F7F\u3046\u8868\u73FE)\",\n  \"feedback\": \"\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF(\u826F\u3044\u70B9\u3068\u6539\u5584\u70B9\u3092\u65E5\u672C\u8A9E\u3067)\",\n  \"rating\": \u8A55\u4FA1(1=\u8981\u6539\u5584\u30015=\u5B8C\u74A7\u306E\u6570\u5024),\n  \"improvements\": [\"\u6539\u5584\u63D0\u68481(\u65E5\u672C\u8A9E\u3067)\", \"\u6539\u5584\u63D0\u68482(\u65E5\u672C\u8A9E\u3067)\"],\n  \"explanation\": \"\u6587\u6CD5\u3084\u8A9E\u5F59\u306E\u8A73\u3057\u3044\u89E3\u8AAC(\u5FC5\u305A\u65E5\u672C\u8A9E\u3067)\",\n  \"similarPhrases\": [\"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA1\", \"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA2\"]\n}\n\n\u8A55\u4FA1\u57FA\u6E96:\n- \u82F1\u6587\u306F\u30B7\u30F3\u30D7\u30EB\u3067\u5B9F\u7528\u7684(TOEIC700\u301C800\u30EC\u30D9\u30EB)\n- \u76F4\u8A33\u3067\u306F\u306A\u304F\u81EA\u7136\u306A\u82F1\u8A9E\n- feedback\u3001improvements\u3001explanation\u306F\u3059\u3079\u3066\u65E5\u672C\u8A9E\u3067\u8AAC\u660E\n- \u4E2D\u5B66\u751F\u3084\u9AD8\u6821\u751F\u306B\u3082\u5206\u304B\u308A\u3084\u3059\u3044\u65E5\u672C\u8A9E\u306E\u89E3\u8AAC";
                userPrompt = "\u65E5\u672C\u8A9E\u6587: ".concat(japaneseSentence, "\n\u30E6\u30FC\u30B6\u30FC\u306E\u82F1\u8A33: ").concat(userTranslation, "\n\n\u4E0A\u8A18\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, , 7]);
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
                content = message.content[0];
                responseText = content.type === "text" ? content.text : "";
                parsedResult = void 0;
                try {
                    parsedResult = JSON.parse(responseText);
                }
                catch (parseError) {
                    jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsedResult = JSON.parse(jsonMatch[0]);
                    }
                    else {
                        throw new Error("No valid JSON found in Claude response");
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
                userEmail = req.headers["x-user-email"] || req.headers["user-email"];
                userId = userEmail || "bizmowa.com";
                return [4 /*yield*/, storage_js_1.storage.addTrainingSession({
                        userId: userId,
                        difficultyLevel: difficultyLevel,
                        japaneseSentence: japaneseSentence,
                        userTranslation: userTranslation,
                        correctTranslation: response.correctTranslation,
                        feedback: response.feedback,
                        rating: response.rating,
                    })];
            case 3:
                trainingSession = _b.sent();
                return [4 /*yield*/, storage_js_1.storage.getCurrentProblemNumber(userId, difficultyLevel)];
            case 4:
                currentProblemNumber = _b.sent();
                return [4 /*yield*/, storage_js_1.storage.updateProblemProgress(userId, difficultyLevel, currentProblemNumber + 1)];
            case 5:
                _b.sent();
                res.json(__assign(__assign({}, response), { sessionId: trainingSession.id }));
                return [3 /*break*/, 7];
            case 6:
                sdkError_1 = _b.sent();
                console.error("Anthropic SDK error:", sdkError_1);
                basicResponse = {
                    correctTranslation: "Please try again. The system is currently experiencing issues.",
                    feedback: "\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002\u73FE\u5728AI\u8A55\u4FA1\u30B7\u30B9\u30C6\u30E0\u306B\u4E00\u6642\u7684\u306A\u554F\u984C\u304C\u767A\u751F\u3057\u3066\u3044\u307E\u3059\u3002",
                    rating: 3,
                    improvements: ["システム復旧をお待ちください"],
                    explanation: "システムメンテナンス中のため、詳細な評価ができません。",
                    similarPhrases: ["Please wait for system recovery."],
                };
                res.json(__assign(__assign({}, basicResponse), { sessionId: 0 }));
                return [3 /*break*/, 7];
            case 7: return [3 /*break*/, 9];
            case 8:
                error_7 = _b.sent();
                console.error("Translation error:", error_7);
                res.status(400).json({ message: "Invalid request data" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.handleClaudeEvaluation = handleClaudeEvaluation;
// ============================================================================
// Stripe関連
// ============================================================================
var handleGetStripePrices = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stripeSecretKey, stripe, prices, formattedPrices, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                }
                stripe = new stripe_1.default(stripeSecretKey);
                return [4 /*yield*/, stripe.prices.list({ limit: 50 })];
            case 1:
                prices = _a.sent();
                formattedPrices = prices.data.map(function (price) { return ({
                    id: price.id,
                    product: price.product,
                    active: price.active,
                    currency: price.currency,
                    unit_amount: price.unit_amount,
                    recurring: price.recurring,
                    type: price.type,
                }); });
                res.json({
                    account_type: stripeSecretKey.startsWith("sk_test_")
                        ? "TEST"
                        : stripeSecretKey.startsWith("sk_live_")
                            ? "LIVE"
                            : "UNKNOWN",
                    total_prices: prices.data.length,
                    prices: formattedPrices,
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                console.error("Error fetching Stripe prices:", error_8);
                res.status(500).json({
                    message: "Stripe価格の取得に失敗しました",
                    error: error_8.message,
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetStripePrices = handleGetStripePrices;
var handleGetSubscriptionPlans = function (req, res) {
    var currentMode = process.env.STRIPE_MODE || "test";
    var currentPrices = priceConfig[currentMode];
    var plans = {
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
};
exports.handleGetSubscriptionPlans = handleGetSubscriptionPlans;
var handleStripePriceInfo = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var priceId, stripeSecretKey, stripe, price, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                priceId = req.body.priceId;
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                }
                stripe = new stripe_1.default(stripeSecretKey);
                return [4 /*yield*/, stripe.prices.retrieve(priceId)];
            case 1:
                price = _a.sent();
                res.json({
                    id: price.id,
                    unit_amount: price.unit_amount,
                    currency: price.currency,
                    type: price.type,
                    product: price.product,
                    active: price.active,
                    recurring: price.recurring,
                });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                console.error("Price info error:", error_9);
                res.status(400).json({
                    message: error_9.message || "価格情報の取得に失敗しました",
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleStripePriceInfo = handleStripePriceInfo;
var handleSavePriceConfiguration = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var priceIds;
    return __generator(this, function (_a) {
        try {
            priceIds = req.body.priceIds;
            if (!priceIds || typeof priceIds !== "object") {
                return [2 /*return*/, res.status(400).json({ message: "価格ID情報が不正です" })];
            }
            if (priceIds.mode) {
                process.env.STRIPE_MODE = priceIds.mode;
                console.log("Switched to ".concat(priceIds.mode, " mode"));
            }
            // 価格IDの更新
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
        return [2 /*return*/];
    });
}); };
exports.handleSavePriceConfiguration = handleSavePriceConfiguration;
var handleCreateCheckoutSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, priceId, successUrl, cancelUrl, stripeSecretKey, stripe, price, priceError_1, session, response, error_10;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                _a = schema_js_1.createCheckoutSessionSchema.parse(req.body), priceId = _a.priceId, successUrl = _a.successUrl, cancelUrl = _a.cancelUrl;
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                }
                stripe = new stripe_1.default(stripeSecretKey);
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, stripe.prices.retrieve(priceId)];
            case 2:
                price = _c.sent();
                console.log("Price found:", price.id, "Amount:", price.unit_amount, "Currency:", price.currency);
                return [3 /*break*/, 4];
            case 3:
                priceError_1 = _c.sent();
                console.error("Price not found:", priceError_1);
                return [2 /*return*/, res.status(400).json({
                        message: "\u4FA1\u683CID \"".concat(priceId, "\" \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002Stripe\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3067\u6B63\u3057\u3044\u4FA1\u683CID\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"),
                        details: priceError_1.message,
                    })];
            case 4: return [4 /*yield*/, stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    mode: "subscription",
                    line_items: [{ price: priceId, quantity: 1 }],
                    success_url: successUrl ||
                        "".concat(req.get("origin"), "/payment-success?session_id={CHECKOUT_SESSION_ID}"),
                    cancel_url: cancelUrl || "".concat(req.get("origin"), "/payment-cancelled"),
                    allow_promotion_codes: true,
                    subscription_data: { trial_period_days: 7 },
                    metadata: {
                        userId: "default_user",
                        planType: getPlanTypeFromPriceId(priceId),
                    },
                })];
            case 5:
                session = _c.sent();
                response = {
                    url: (_b = session.url) !== null && _b !== void 0 ? _b : "",
                    sessionId: session.id,
                };
                res.json(response);
                return [3 /*break*/, 7];
            case 6:
                error_10 = _c.sent();
                console.error("Stripe error:", error_10);
                res.status(500).json({ message: "決済セッションの作成に失敗しました" });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.handleCreateCheckoutSession = handleCreateCheckoutSession;
// ============================================================================
// セッション管理
// ============================================================================
var handleGetSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessions, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getTrainingSessions()];
            case 1:
                sessions = _a.sent();
                res.json(sessions);
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                res.status(500).json({ message: "履歴の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetSessions = handleGetSessions;
var handleGetSessionsByDifficulty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var difficulty, sessions, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                difficulty = req.params.difficulty;
                return [4 /*yield*/, storage_js_1.storage.getSessionsByDifficulty(difficulty)];
            case 1:
                sessions = _a.sent();
                res.json(sessions);
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                res.status(500).json({ message: "履歴の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetSessionsByDifficulty = handleGetSessionsByDifficulty;
// ============================================================================
// プログレス・統計
// ============================================================================
var handleGetUserGoals = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var goals, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getUserGoals()];
            case 1:
                goals = _a.sent();
                res.json(goals || { dailyGoal: 30, monthlyGoal: 900 });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _a.sent();
                console.error("User goals error:", error_13);
                res.status(500).json({ message: "目標の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetUserGoals = handleGetUserGoals;
var handleUpdateUserGoals = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, dailyGoal, monthlyGoal, goals, error_14;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, dailyGoal = _a.dailyGoal, monthlyGoal = _a.monthlyGoal;
                return [4 /*yield*/, storage_js_1.storage.updateUserGoals({ dailyGoal: dailyGoal, monthlyGoal: monthlyGoal })];
            case 1:
                goals = _b.sent();
                res.json(goals);
                return [3 /*break*/, 3];
            case 2:
                error_14 = _b.sent();
                res.status(500).json({ message: "目標の更新に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateUserGoals = handleUpdateUserGoals;
var handleGetProgress = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, period, endDate, startDate, progress, error_15;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query.period, period = _a === void 0 ? "week" : _a;
                endDate = new Date();
                startDate = new Date();
                if (period === "week") {
                    startDate.setDate(endDate.getDate() - 7);
                }
                else if (period === "month") {
                    startDate.setMonth(endDate.getMonth() - 1);
                }
                else {
                    startDate.setDate(endDate.getDate() - 1);
                }
                return [4 /*yield*/, storage_js_1.storage.getProgressHistory(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0])];
            case 1:
                progress = _b.sent();
                res.json(progress);
                return [3 /*break*/, 3];
            case 2:
                error_15 = _b.sent();
                res.status(500).json({ message: "進捗データの取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetProgress = handleGetProgress;
var handleGetStreak = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var streak, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getStreakCount()];
            case 1:
                streak = _a.sent();
                res.json({ streak: streak });
                return [3 /*break*/, 3];
            case 2:
                error_16 = _a.sent();
                res.status(500).json({ message: "連続学習日数の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetStreak = handleGetStreak;
var handleGetDifficultyStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats, error_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getDifficultyStats()];
            case 1:
                stats = _a.sent();
                res.json(stats);
                return [3 /*break*/, 3];
            case 2:
                error_17 = _a.sent();
                res.status(500).json({ message: "レベル別統計の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetDifficultyStats = handleGetDifficultyStats;
var handleGetMonthlyStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var year, month, stats, error_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                year = parseInt(req.query.year) || new Date().getFullYear();
                month = parseInt(req.query.month) || new Date().getMonth() + 1;
                return [4 /*yield*/, storage_js_1.storage.getMonthlyStats(year, month)];
            case 1:
                stats = _a.sent();
                res.json(stats);
                return [3 /*break*/, 3];
            case 2:
                error_18 = _a.sent();
                res.status(500).json({ message: "月間統計の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetMonthlyStats = handleGetMonthlyStats;
// ============================================================================
// 復習・ブックマーク
// ============================================================================
var handleGetReviewSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var threshold, sessions, error_19;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                threshold = parseInt(req.query.threshold) || 2;
                return [4 /*yield*/, storage_js_1.storage.getSessionsForReview(threshold)];
            case 1:
                sessions = _a.sent();
                res.json(sessions);
                return [3 /*break*/, 3];
            case 2:
                error_19 = _a.sent();
                res.status(500).json({ message: "復習セッションの取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetReviewSessions = handleGetReviewSessions;
var handleGetRecentSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var daysBack, sessions, error_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                daysBack = parseInt(req.query.days) || 7;
                return [4 /*yield*/, storage_js_1.storage.getRecentSessions(daysBack)];
            case 1:
                sessions = _a.sent();
                res.json(sessions);
                return [3 /*break*/, 3];
            case 2:
                error_20 = _a.sent();
                res.status(500).json({ message: "直近の練習履歴の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetRecentSessions = handleGetRecentSessions;
var handleGetBookmarkedSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessions, error_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getBookmarkedSessions()];
            case 1:
                sessions = _a.sent();
                res.json(sessions);
                return [3 /*break*/, 3];
            case 2:
                error_21 = _a.sent();
                res.status(500).json({ message: "ブックマークの取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetBookmarkedSessions = handleGetBookmarkedSessions;
var handleUpdateBookmark = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, isBookmarked, error_22;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = parseInt(req.params.id);
                isBookmarked = req.body.isBookmarked;
                return [4 /*yield*/, storage_js_1.storage.updateBookmark(sessionId, isBookmarked)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_22 = _a.sent();
                res.status(500).json({ message: "ブックマークの更新に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateBookmark = handleUpdateBookmark;
var handleUpdateReviewCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, error_23;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = parseInt(req.params.id);
                return [4 /*yield*/, storage_js_1.storage.updateReviewCount(sessionId)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_23 = _a.sent();
                res.status(500).json({ message: "復習カウントの更新に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateReviewCount = handleUpdateReviewCount;
// ============================================================================
// カスタムシナリオ（プレミアム機能）
// ============================================================================
var handleGetCustomScenarios = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var scenarios, error_24;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getCustomScenarios()];
            case 1:
                scenarios = _a.sent();
                res.json(scenarios);
                return [3 /*break*/, 3];
            case 2:
                error_24 = _a.sent();
                res.status(500).json({ message: "カスタムシナリオの取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetCustomScenarios = handleGetCustomScenarios;
var handleCreateCustomScenario = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, scenario, error_25;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, title = _a.title, description = _a.description;
                return [4 /*yield*/, storage_js_1.storage.addCustomScenario({ title: title, description: description })];
            case 1:
                scenario = _b.sent();
                res.json(scenario);
                return [3 /*break*/, 3];
            case 2:
                error_25 = _b.sent();
                res.status(500).json({ message: "カスタムシナリオの作成に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleCreateCustomScenario = handleCreateCustomScenario;
var handleUpdateCustomScenario = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, title, description, scenario, error_26;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                _a = req.body, title = _a.title, description = _a.description;
                return [4 /*yield*/, storage_js_1.storage.updateCustomScenario(id, {
                        title: title,
                        description: description,
                    })];
            case 1:
                scenario = _b.sent();
                res.json(scenario);
                return [3 /*break*/, 3];
            case 2:
                error_26 = _b.sent();
                res.status(500).json({ message: "カスタムシナリオの更新に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateCustomScenario = handleUpdateCustomScenario;
var handleDeleteCustomScenario = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_27;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, storage_js_1.storage.deleteCustomScenario(id)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_27 = _a.sent();
                res.status(500).json({ message: "カスタムシナリオの削除に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleDeleteCustomScenario = handleDeleteCustomScenario;
var handleGetCustomScenario = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, scenario, error_28;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, storage_js_1.storage.getCustomScenario(id)];
            case 1:
                scenario = _a.sent();
                if (!scenario) {
                    return [2 /*return*/, res.status(404).json({ message: "シナリオが見つかりません" })];
                }
                res.json(scenario);
                return [3 /*break*/, 3];
            case 2:
                error_28 = _a.sent();
                res.status(500).json({ message: "シナリオの取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetCustomScenario = handleGetCustomScenario;
// ============================================================================
// シミュレーション機能（プレミアム）
// ============================================================================
var handleGetSimulationProblem = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var scenarioId, scenario, anthropicApiKey, prompt_1, anthropicResponse, anthropicData, result, sessionId, usedProblems, variationPrompt, retryResponse, retryData, retryResult, retryError_1, anthropicError_1, error_29;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 13, , 14]);
                scenarioId = parseInt(req.params.scenarioId);
                return [4 /*yield*/, storage_js_1.storage.getCustomScenario(scenarioId)];
            case 1:
                scenario = _a.sent();
                if (!scenario) {
                    return [2 /*return*/, res.status(404).json({ message: "シナリオが見つかりません" })];
                }
                anthropicApiKey = process.env.ANTHROPIC_API_KEY;
                if (!anthropicApiKey) {
                    return [2 /*return*/, res
                            .status(500)
                            .json({ message: "Anthropic API key not configured" })];
                }
                prompt_1 = "\u4EE5\u4E0B\u306E\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u8A2D\u5B9A\u306B\u57FA\u3065\u3044\u3066\u3001\u5B9F\u8DF5\u7684\u306A\u65E5\u672C\u8A9E\u6587\u30921\u3064\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3: ".concat(scenario.title, "\n\u8A73\u7D30: ").concat(scenario.description, "\n\n\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044:\n{\n  \"japaneseSentence\": \"\u65E5\u672C\u8A9E\u306E\u6587\u7AE0\",\n  \"context\": \"\u5177\u4F53\u7684\u306A\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u306E\u8AAC\u660E(20\u6587\u5B57\u4EE5\u5185)\"\n}\n\n\u5B9F\u969B\u306E\u5834\u9762\u3067\u4F7F\u308F\u308C\u305D\u3046\u306A\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u6587\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
                _a.label = 2;
            case 2:
                _a.trys.push([2, 11, , 12]);
                return [4 /*yield*/, fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            Authorization: "Bearer ".concat(anthropicApiKey),
                            "Content-Type": "application/json",
                            "anthropic-version": "2023-06-01",
                        },
                        body: JSON.stringify({
                            model: "claude-3-haiku-20240307",
                            max_tokens: 500,
                            temperature: 0.8,
                            messages: [{ role: "user", content: prompt_1 }],
                        }),
                    })];
            case 3:
                anthropicResponse = _a.sent();
                if (!anthropicResponse.ok) {
                    throw new Error("Anthropic API error: ".concat(anthropicResponse.status));
                }
                return [4 /*yield*/, anthropicResponse.json()];
            case 4:
                anthropicData = _a.sent();
                result = JSON.parse(anthropicData.content[0].text);
                sessionId = "".concat(getSessionId(req), "-simulation-").concat(scenarioId);
                usedProblems = getUsedProblems(sessionId);
                if (!usedProblems.has(result.japaneseSentence)) return [3 /*break*/, 10];
                variationPrompt = "".concat(prompt_1, "\n\n\u65E2\u306B\u4F7F\u7528\u3055\u308C\u305F\u554F\u984C: ").concat(Array.from(usedProblems).join(", "), "\n\n\u4E0A\u8A18\u3068\u306F\u7570\u306A\u308B\u65B0\u3057\u3044\u554F\u984C\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
                _a.label = 5;
            case 5:
                _a.trys.push([5, 9, , 10]);
                return [4 /*yield*/, fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            Authorization: "Bearer ".concat(anthropicApiKey),
                            "Content-Type": "application/json",
                            "anthropic-version": "2023-06-01",
                        },
                        body: JSON.stringify({
                            model: "claude-3-haiku-20240307",
                            max_tokens: 500,
                            temperature: 0.9,
                            messages: [{ role: "user", content: variationPrompt }],
                        }),
                    })];
            case 6:
                retryResponse = _a.sent();
                if (!retryResponse.ok) return [3 /*break*/, 8];
                return [4 /*yield*/, retryResponse.json()];
            case 7:
                retryData = _a.sent();
                retryResult = JSON.parse(retryData.content[0].text);
                markProblemAsUsed(sessionId, retryResult.japaneseSentence);
                return [2 /*return*/, res.json({
                        japaneseSentence: retryResult.japaneseSentence,
                        context: retryResult.context || scenario.description,
                    })];
            case 8: return [3 /*break*/, 10];
            case 9:
                retryError_1 = _a.sent();
                console.log("Retry generation failed, using original");
                return [3 /*break*/, 10];
            case 10:
                markProblemAsUsed(sessionId, result.japaneseSentence);
                res.json({
                    japaneseSentence: result.japaneseSentence,
                    context: result.context || scenario.description,
                });
                return [3 /*break*/, 12];
            case 11:
                anthropicError_1 = _a.sent();
                console.error("Anthropic API error:", anthropicError_1);
                res.status(500).json({ message: "問題生成に失敗しました" });
                return [3 /*break*/, 12];
            case 12: return [3 /*break*/, 14];
            case 13:
                error_29 = _a.sent();
                console.error("Simulation problem error:", error_29);
                res.status(500).json({ message: "問題生成に失敗しました" });
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.handleGetSimulationProblem = handleGetSimulationProblem;
var handleSimulationTranslate = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, scenarioId, japaneseSentence, userTranslation, context, anthropicApiKey, scenario, prompt_2, anthropicResponse, anthropicData, parsedResult, response, anthropicError_2, error_30;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                _a = req.body, scenarioId = _a.scenarioId, japaneseSentence = _a.japaneseSentence, userTranslation = _a.userTranslation, context = _a.context;
                anthropicApiKey = process.env.ANTHROPIC_API_KEY;
                if (!anthropicApiKey) {
                    return [2 /*return*/, res
                            .status(500)
                            .json({ message: "Anthropic API key not configured" })];
                }
                return [4 /*yield*/, storage_js_1.storage.getCustomScenario(scenarioId)];
            case 1:
                scenario = _b.sent();
                if (!scenario) {
                    return [2 /*return*/, res.status(404).json({ message: "シナリオが見つかりません" })];
                }
                prompt_2 = "\u3042\u306A\u305F\u306F\u82F1\u8A9E\u6559\u5E2B\u3067\u3059\u3002\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2\u306E\u82F1\u8A33\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u8A2D\u5B9A: ".concat(scenario.title, "\n\u8A73\u7D30: ").concat(scenario.description, "\n\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3: ").concat(context, "\n\u65E5\u672C\u8A9E\u6587: ").concat(japaneseSentence, "\n\u30E6\u30FC\u30B6\u30FC\u306E\u82F1\u8A33: ").concat(userTranslation, "\n\n\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044:\n{\n  \"correctTranslation\": \"\u6B63\u3057\u3044\u82F1\u8A33(\u305D\u306E\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u306B\u6700\u9069\u306A\u8868\u73FE)\",\n  \"feedback\": \"\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF(\u826F\u3044\u70B9\u3068\u6539\u5584\u70B9)\",\n  \"rating\": 1\u304B\u30895\u306E\u8A55\u4FA1(1=\u8981\u6539\u5584\u30015=\u5B8C\u74A7),\n  \"improvements\": [\"\u6539\u5584\u63D0\u68481\", \"\u6539\u5584\u63D0\u68482\"],\n  \"explanation\": \"\u305D\u306E\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u3067\u306E\u8868\u73FE\u306E\u30DD\u30A4\u30F3\u30C8(\u65E5\u672C\u8A9E\u3067)\",\n  \"similarPhrases\": [\"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA1\", \"\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA2\"]\n}");
                _b.label = 2;
            case 2:
                _b.trys.push([2, 6, , 7]);
                return [4 /*yield*/, fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            Authorization: "Bearer ".concat(anthropicApiKey),
                            "Content-Type": "application/json",
                            "anthropic-version": "2023-06-01",
                        },
                        body: JSON.stringify({
                            model: "claude-3-haiku-20240307",
                            max_tokens: 1000,
                            temperature: 0.7,
                            messages: [{ role: "user", content: prompt_2 }],
                        }),
                    })];
            case 3:
                anthropicResponse = _b.sent();
                if (!anthropicResponse.ok) {
                    throw new Error("Anthropic API error: ".concat(anthropicResponse.status));
                }
                return [4 /*yield*/, anthropicResponse.json()];
            case 4:
                anthropicData = _b.sent();
                parsedResult = JSON.parse(anthropicData.content[0].text);
                response = {
                    correctTranslation: parsedResult.correctTranslation,
                    feedback: parsedResult.feedback,
                    rating: Math.max(1, Math.min(5, parsedResult.rating)),
                    improvements: parsedResult.improvements || [],
                    explanation: parsedResult.explanation || "",
                    similarPhrases: parsedResult.similarPhrases || [],
                };
                return [4 /*yield*/, storage_js_1.storage.addTrainingSession({
                        difficultyLevel: "simulation-".concat(scenarioId),
                        japaneseSentence: japaneseSentence,
                        userTranslation: userTranslation,
                        correctTranslation: response.correctTranslation,
                        feedback: response.feedback,
                        rating: response.rating,
                    })];
            case 5:
                _b.sent();
                res.json(response);
                return [3 /*break*/, 7];
            case 6:
                anthropicError_2 = _b.sent();
                console.error("Anthropic API error:", anthropicError_2);
                res.status(500).json({
                    message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。",
                });
                return [3 /*break*/, 7];
            case 7: return [3 /*break*/, 9];
            case 8:
                error_30 = _b.sent();
                console.error("Simulation translation error:", error_30);
                res.status(500).json({ message: "翻訳評価に失敗しました" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.handleSimulationTranslate = handleSimulationTranslate;
// ============================================================================
// 日次カウント管理
// ============================================================================
var handleGetDailyCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var count, error_31;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.getTodaysProblemCount()];
            case 1:
                count = _a.sent();
                res.json({ count: count, remaining: Math.max(0, 100 - count) });
                return [3 /*break*/, 3];
            case 2:
                error_31 = _a.sent();
                console.error("Error getting daily count:", error_31);
                res.status(500).json({ message: "Failed to get daily count" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetDailyCount = handleGetDailyCount;
var handleResetDailyCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_32;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.resetDailyCount()];
            case 1:
                _a.sent();
                res.json({ message: "Daily count reset successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_32 = _a.sent();
                console.error("Error resetting daily count:", error_32);
                res.status(500).json({ message: "Failed to reset daily count" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleResetDailyCount = handleResetDailyCount;
// ============================================================================
// その他のハンドラー
// ============================================================================
var handleEmergencyReset = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, tempPassword, resetSolution;
    return __generator(this, function (_a) {
        try {
            email = req.body.email;
            if (!email) {
                return [2 /*return*/, res.status(400).json({ error: "Email is required" })];
            }
            console.log("Emergency password reset requested for:", email);
            tempPassword = "EmergencyPass123!" + Math.random().toString(36).substring(2, 8);
            resetSolution = {
                email: email,
                tempPassword: tempPassword,
                message: "Supabaseメール送信の問題により、緊急対応策を提供します",
                solution: "direct_access",
                steps: [
                    "1. 以下の情報で新しいアカウントを作成してください",
                    "2. 登録後、すぐにパスワードを変更してください",
                    "3. 必要に応じて、古いアカウントデータを移行します",
                    "4. この一時パスワードは24時間後に無効になります",
                ],
                credentials: { email: email, temporaryPassword: tempPassword },
                loginUrl: "".concat(req.protocol, "://").concat(req.get("host"), "/login"),
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };
            console.log("Emergency credentials created:", resetSolution);
            res.json({ success: true, solution: resetSolution });
        }
        catch (error) {
            console.error("Emergency reset error:", error);
            res.status(500).json({ error: "Emergency reset failed" });
        }
        return [2 /*return*/];
    });
}); };
exports.handleEmergencyReset = handleEmergencyReset;
var handleCreateSubscription = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionId, priceId, planType, userId, error_33;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, sessionId = _a.sessionId, priceId = _a.priceId;
                if (!sessionId || !priceId) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "SessionID and PriceID are required" })];
                }
                planType = getPlanTypeFromPriceId(priceId);
                userId = "bizmowa.com";
                return [4 /*yield*/, storage_js_1.storage.updateUserSubscription(userId, {
                        subscriptionType: planType,
                        subscriptionStatus: "trialing",
                        userId: userId,
                        stripeCustomerId: "cus_test_".concat(sessionId),
                        stripeSubscriptionId: "sub_test_".concat(sessionId),
                        trialStart: new Date(),
                        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    })];
            case 1:
                _b.sent();
                console.log("Manual subscription created: ".concat(planType, " for session: ").concat(sessionId));
                res.json({
                    success: true,
                    message: "サブスクリプションが作成されました",
                    subscriptionType: planType,
                    status: "trialing",
                });
                return [3 /*break*/, 3];
            case 2:
                error_33 = _b.sent();
                console.error("Error creating subscription:", error_33);
                res.status(500).json({ message: "サブスクリプションの作成に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleCreateSubscription = handleCreateSubscription;
var handleCreateCustomerPortal = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stripeSecretKey, stripe, customerId, session, error_34;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                }
                stripe = new stripe_1.default(stripeSecretKey);
                customerId = "cus_example123";
                return [4 /*yield*/, stripe.billingPortal.sessions.create({
                        customer: customerId,
                        return_url: "".concat(req.get("origin"), "/my-page?tab=account"),
                    })];
            case 1:
                session = _a.sent();
                res.json({ url: session.url });
                return [3 /*break*/, 3];
            case 2:
                error_34 = _a.sent();
                console.error("Stripe Customer Portal error:", error_34);
                res.status(500).json({ message: "カスタマーポータルの作成に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleCreateCustomerPortal = handleCreateCustomerPortal;
var handleGetSubscriptionDetails = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, subscription, trialEndDate, subscriptionDetails, error_35;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = "default_user";
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription(userId)];
            case 1:
                subscription = _a.sent();
                if (!subscription) {
                    return [2 /*return*/, res.status(404).json({ message: "Subscription not found" })];
                }
                trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 5);
                subscriptionDetails = __assign(__assign({}, subscription), { isTrialActive: true, trialDaysRemaining: 5, trialEndDate: trialEndDate.toISOString(), nextBillingDate: "2025-07-27", currentPeriodStart: "2025-06-27", currentPeriodEnd: "2025-07-27", planType: subscription.subscriptionType === "premium" ? "monthly" : "monthly", amount: subscription.subscriptionType === "premium" ? 3980 : 1980 });
                res.json(subscriptionDetails);
                return [3 /*break*/, 3];
            case 2:
                error_35 = _a.sent();
                console.error("Get subscription details error:", error_35);
                res
                    .status(500)
                    .json({ message: "サブスクリプション詳細の取得に失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleGetSubscriptionDetails = handleGetSubscriptionDetails;
var handleUpgradeSubscription = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var planType, stripeSecretKey, stripe, subscription, premiumPriceIds, targetPriceId, stripeSubscription, subscriptionItemId, updatedSubscription, error_36;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                planType = req.body.planType;
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                }
                stripe = new stripe_1.default(stripeSecretKey);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                subscription = _a.sent();
                if (!subscription || !subscription.stripeSubscriptionId) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "アクティブなサブスクリプションが見つかりません" })];
                }
                premiumPriceIds = {
                    monthly: "price_1ReXP9Hridtc6DvMpgawL58K",
                    yearly: "price_1ReXPnHridtc6DvMQaW7NC6w",
                };
                targetPriceId = premiumPriceIds[planType];
                if (!targetPriceId) {
                    return [2 /*return*/, res.status(400).json({ message: "無効なプランタイプです" })];
                }
                return [4 /*yield*/, stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)];
            case 2:
                stripeSubscription = _a.sent();
                if (!stripeSubscription.items.data[0]) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "サブスクリプションアイテムが見つかりません" })];
                }
                subscriptionItemId = stripeSubscription.items.data[0].id;
                return [4 /*yield*/, stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                        items: [{ id: subscriptionItemId, price: targetPriceId }],
                        proration_behavior: "create_prorations",
                    })];
            case 3:
                updatedSubscription = _a.sent();
                return [4 /*yield*/, storage_js_1.storage.updateUserSubscription(subscription.userId, {
                        subscriptionType: "premium",
                        stripeSubscriptionItemId: subscriptionItemId,
                        planName: planType === "monthly" ? "premium_monthly" : "premium_yearly",
                    })];
            case 4:
                _a.sent();
                res.json({
                    success: true,
                    message: "\u30D7\u30EC\u30DF\u30A2\u30E0".concat(planType === "monthly" ? "月額" : "年間", "\u30D7\u30E9\u30F3\u306B\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u3057\u307E\u3057\u305F(\u65E5\u5272\u308A\u8A08\u7B97\u9069\u7528)"),
                    subscriptionId: updatedSubscription.id,
                });
                return [3 /*break*/, 6];
            case 5:
                error_36 = _a.sent();
                console.error("Upgrade subscription error:", error_36);
                res.status(500).json({ message: "アップグレードに失敗しました" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.handleUpgradeSubscription = handleUpgradeSubscription;
var handleResetUserData = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_37;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storage_js_1.storage.resetUserData()];
            case 1:
                _a.sent();
                res.json({ success: true, message: "ユーザーデータをリセットしました" });
                return [3 /*break*/, 3];
            case 2:
                error_37 = _a.sent();
                console.error("Reset user data error:", error_37);
                res.status(500).json({ message: "データのリセットに失敗しました" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleResetUserData = handleResetUserData;
// ============================================================================
// 管理者機能
// ============================================================================
var handleGetAdminStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userSubscription, stats, error_38;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                userSubscription = _a.sent();
                if (!(userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.isAdmin)) {
                    return [2 /*return*/, res.status(403).json({ message: "管理者権限が必要です" })];
                }
                return [4 /*yield*/, storage_js_1.storage.getAdminStats()];
            case 2:
                stats = _a.sent();
                res.json(stats);
                return [3 /*break*/, 4];
            case 3:
                error_38 = _a.sent();
                console.error("Admin stats error:", error_38);
                res.status(500).json({ message: "統計データの取得に失敗しました" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handleGetAdminStats = handleGetAdminStats;
var handleGetAdminUsers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userSubscription, users, error_39;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                userSubscription = _a.sent();
                if (!(userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.isAdmin)) {
                    return [2 /*return*/, res.status(403).json({ message: "管理者権限が必要です" })];
                }
                return [4 /*yield*/, storage_js_1.storage.getAllUsers()];
            case 2:
                users = _a.sent();
                res.json(users);
                return [3 /*break*/, 4];
            case 3:
                error_39 = _a.sent();
                console.error("Admin users error:", error_39);
                res.status(500).json({ message: "ユーザーデータの取得に失敗しました" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handleGetAdminUsers = handleGetAdminUsers;
var handleGetAdminAnalytics = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userSubscription, analytics, error_40;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                userSubscription = _a.sent();
                if (!(userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.isAdmin)) {
                    return [2 /*return*/, res.status(403).json({ message: "管理者権限が必要です" })];
                }
                return [4 /*yield*/, storage_js_1.storage.getLearningAnalytics()];
            case 2:
                analytics = _a.sent();
                res.json(analytics);
                return [3 /*break*/, 4];
            case 3:
                error_40 = _a.sent();
                console.error("Admin analytics error:", error_40);
                res.status(500).json({ message: "分析データの取得に失敗しました" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handleGetAdminAnalytics = handleGetAdminAnalytics;
var handleAdminExport = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userSubscription, type, csvData, error_41;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                userSubscription = _a.sent();
                if (!(userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.isAdmin)) {
                    return [2 /*return*/, res.status(403).json({ message: "管理者権限が必要です" })];
                }
                type = req.params.type;
                return [4 /*yield*/, storage_js_1.storage.exportData(type)];
            case 2:
                csvData = _a.sent();
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=\"".concat(type, "-export.csv\""));
                res.send(csvData);
                return [3 /*break*/, 4];
            case 3:
                error_41 = _a.sent();
                console.error("Export error:", error_41);
                res.status(500).json({ message: "データのエクスポートに失敗しました" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handleAdminExport = handleAdminExport;
var handleUpdateUserSubscription = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userSubscription, userId, subscriptionType, updatedSubscription, error_42;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, storage_js_1.storage.getUserSubscription()];
            case 1:
                userSubscription = _a.sent();
                if (!(userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.isAdmin)) {
                    return [2 /*return*/, res.status(403).json({ message: "管理者権限が必要です" })];
                }
                userId = req.params.userId;
                subscriptionType = req.body.subscriptionType;
                if (!subscriptionType ||
                    !["standard", "premium"].includes(subscriptionType)) {
                    return [2 /*return*/, res.status(400).json({
                            message: "有効なサブスクリプションタイプを指定してください",
                        })];
                }
                return [4 /*yield*/, storage_js_1.storage.updateUserSubscription(userId, {
                        subscriptionType: subscriptionType,
                    })];
            case 2:
                updatedSubscription = _a.sent();
                res.json(updatedSubscription);
                return [3 /*break*/, 4];
            case 3:
                error_42 = _a.sent();
                console.error("Update subscription error:", error_42);
                res.status(500).json({ message: "サブスクリプションの更新に失敗しました" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateUserSubscription = handleUpdateUserSubscription;
// ============================================================================
// Webhook処理（別ファイル用）
// ============================================================================
var handleStripeWebhook = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sig, stripeSecretKey, webhookSecret, event_1, error_43, stripe, event, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sig = req.headers["stripe-signature"];
                stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
                if (!stripeSecretKey) {
                    return [2 /*return*/, res.status(400).send("Webhook Error: Missing Stripe configuration")];
                }
                if (!sig || typeof sig !== "string") {
                    return [2 /*return*/, res.status(400).send("Missing or invalid Stripe signature header")];
                }
                if (!!webhookSecret) return [3 /*break*/, 4];
                console.log("Webhook secret not configured, processing without verification");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                event_1 = JSON.parse(req.body);
                return [4 /*yield*/, processWebhookEvent(event_1)];
            case 2:
                _a.sent();
                return [2 /*return*/, res.json({ received: true })];
            case 3:
                error_43 = _a.sent();
                console.error("Error processing webhook without verification:", error_43);
                return [2 /*return*/, res.status(400).send("Invalid webhook payload")];
            case 4:
                stripe = new stripe_1.default(stripeSecretKey);
                try {
                    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
                }
                catch (err) {
                    errorMessage = err instanceof Error ? err.message : "Unknown error";
                    console.log("Webhook signature verification failed.", errorMessage);
                    return [2 /*return*/, res.status(400).send("Webhook Error: ".concat(errorMessage))];
                }
                return [4 /*yield*/, processWebhookEvent(event)];
            case 5:
                _a.sent();
                res.json({ received: true });
                return [2 /*return*/];
        }
    });
}); };
exports.handleStripeWebhook = handleStripeWebhook;
function processWebhookEvent(event) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, session, planType, userId, error_44, error_45, error_46;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = event.type;
                    switch (_a) {
                        case "checkout.session.completed": return [3 /*break*/, 1];
                        case "customer.subscription.deleted": return [3 /*break*/, 6];
                        case "invoice.payment_succeeded": return [3 /*break*/, 10];
                    }
                    return [3 /*break*/, 14];
                case 1:
                    session = event.data.object;
                    planType = getPlanTypeFromPriceId(((_d = (_c = (_b = session.line_items) === null || _b === void 0 ? void 0 : _b.data[0]) === null || _c === void 0 ? void 0 : _c.price) === null || _d === void 0 ? void 0 : _d.id) || "");
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 4, , 5]);
                    userId = ((_e = session.metadata) === null || _e === void 0 ? void 0 : _e.userId) || "bizmowa.com";
                    return [4 /*yield*/, storage_js_1.storage.updateUserSubscription(userId, {
                            subscriptionType: planType,
                            subscriptionStatus: "trialing",
                            userId: userId,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            trialStart: new Date(),
                            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        })];
                case 3:
                    _f.sent();
                    console.log("User subscription updated to ".concat(planType, " for session: ").concat(session.id));
                    return [3 /*break*/, 5];
                case 4:
                    error_44 = _f.sent();
                    console.error("Error updating subscription:", error_44);
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 15];
                case 6:
                    _f.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, storage_js_1.storage.updateUserSubscription("bizmowa.com", {
                            subscriptionType: "standard",
                            subscriptionStatus: "inactive",
                        })];
                case 7:
                    _f.sent();
                    console.log("User subscription cancelled");
                    return [3 /*break*/, 9];
                case 8:
                    error_45 = _f.sent();
                    console.error("Error cancelling subscription:", error_45);
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 15];
                case 10:
                    _f.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, storage_js_1.storage.updateUserSubscription("bizmowa.com", {
                            subscriptionStatus: "active",
                        })];
                case 11:
                    _f.sent();
                    console.log("User subscription activated after payment");
                    return [3 /*break*/, 13];
                case 12:
                    error_46 = _f.sent();
                    console.error("Error activating subscription:", error_46);
                    return [3 /*break*/, 13];
                case 13: return [3 /*break*/, 15];
                case 14:
                    console.log("Unhandled event type ".concat(event.type));
                    _f.label = 15;
                case 15: return [2 /*return*/];
            }
        });
    });
}
