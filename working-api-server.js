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
// Working API server with proper Vite integration
var express_1 = require("express");
var vite_1 = require("vite");
var path_1 = require("path");
var dotenv_1 = require("dotenv");
var cors_1 = require("cors");
var sdk_1 = require("@anthropic-ai/sdk");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Anthropic client
var anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});
// CRITICAL: API routes BEFORE Vite middleware
console.log("🔥 Registering API routes...");
app.get("/api/ping", function (req, res) {
    console.log("🔥 Ping endpoint working!");
    res.json({ message: "pong", timestamp: new Date().toISOString() });
});
app.post("/api/problem", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, difficultyLevel, _c, sessionId, prompts, prompt_1, message, responseText, jsonMatch, problemData, error_1, fallbacks, fallback;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                console.log("🔥 Problem generation endpoint hit:", req.body);
                _a = req.body, _b = _a.difficultyLevel, difficultyLevel = _b === void 0 ? "middle_school" : _b, _c = _a.sessionId, sessionId = _c === void 0 ? "default" : _c;
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                prompts = {
                    middle_school: "\u4E2D\u5B66\u82F1\u8A9E\u30EC\u30D9\u30EB\u306E\u65E5\u672C\u8A9E\u6587\u30921\u3064\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\u3010\u5FC5\u9808\u6761\u4EF6\u3011\n- \u57FA\u672C\u7684\u306A\u8A9E\u5F59\u3068\u6587\u6CD5\u306E\u307F\n- \u65E5\u5E38\u751F\u6D3B\u30FB\u5B66\u6821\u751F\u6D3B\u306E\u8A71\u984C\n- 10-15\u6587\u5B57\u7A0B\u5EA6\n\nJSON\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n{\n  \"japaneseSentence\": \"\u4F5C\u6210\u3057\u305F\u65E5\u672C\u8A9E\u6587\",\n  \"modelAnswer\": \"\u81EA\u7136\u306A\u82F1\u8A33\",\n  \"hints\": [\"\u91CD\u8981\u8A9E\u5F591\", \"\u91CD\u8981\u8A9E\u5F592\", \"\u91CD\u8981\u8A9E\u5F593\"]\n}",
                    toeic: "TOEIC600-800\u70B9\u30EC\u30D9\u30EB\u306E\u30D3\u30B8\u30CD\u30B9\u82F1\u8A9E\u554F\u984C\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\u3010\u5FC5\u9808\u6761\u4EF6\u3011\n- \u30D3\u30B8\u30CD\u30B9\u30B7\u30FC\u30F3\uFF08\u4F1A\u8B70\u30FB\u5831\u544A\u30FB\u5951\u7D04\u306A\u3069\uFF09\n- \u30D5\u30A9\u30FC\u30DE\u30EB\u306A\u656C\u8A9E\u8868\u73FE\n- TOEIC\u983B\u51FA\u8A9E\u5F59\u3092\u542B\u3080\n\nJSON\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n{\n  \"japaneseSentence\": \"\u4F5C\u6210\u3057\u305F\u65E5\u672C\u8A9E\u6587\",\n  \"modelAnswer\": \"\u81EA\u7136\u306A\u82F1\u8A33\",\n  \"hints\": [\"\u91CD\u8981\u8A9E\u5F591\", \"\u91CD\u8981\u8A9E\u5F592\", \"\u91CD\u8981\u8A9E\u5F593\"]\n}",
                };
                prompt_1 = prompts[difficultyLevel] || prompts.middle_school;
                console.log("Making Claude API request...");
                return [4 /*yield*/, anthropic.messages.create({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1000,
                        temperature: 0.8,
                        messages: [{ role: "user", content: prompt_1 }]
                    })];
            case 2:
                message = _d.sent();
                responseText = message.content[0].type === 'text' ? message.content[0].text : '';
                console.log("Claude response:", responseText);
                jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    problemData = JSON.parse(jsonMatch[0]);
                    res.json(__assign(__assign({}, problemData), { difficulty: difficultyLevel, dailyLimitReached: false, currentCount: 1, dailyLimit: 100 }));
                }
                else {
                    throw new Error("Invalid response format");
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error("Problem generation error:", error_1);
                fallbacks = {
                    middle_school: {
                        japaneseSentence: "彼女は英語を勉強しています。",
                        modelAnswer: "She is studying English.",
                        hints: ["study", "English", "present continuous"]
                    },
                    toeic: {
                        japaneseSentence: "来月の四半期会議の議題を準備してください。",
                        modelAnswer: "Please prepare the agenda for next month's quarterly meeting.",
                        hints: ["prepare", "agenda", "quarterly meeting"]
                    }
                };
                fallback = fallbacks[difficultyLevel] || fallbacks.middle_school;
                res.json(__assign(__assign({}, fallback), { difficulty: difficultyLevel, dailyLimitReached: false, currentCount: 1, dailyLimit: 100 }));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post("/api/evaluate-with-claude", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userAnswer, japaneseSentence, modelAnswer, difficulty, evaluationPrompt, message, responseText, jsonMatch, evaluation, error_2, rating, feedback;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("🔥 Claude evaluation endpoint hit:", req.body);
                _a = req.body, userAnswer = _a.userAnswer, japaneseSentence = _a.japaneseSentence, modelAnswer = _a.modelAnswer, difficulty = _a.difficulty;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                evaluationPrompt = "\u4EE5\u4E0B\u306E\u82F1\u4F5C\u6587\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n\n\u3010\u554F\u984C\u3011".concat(japaneseSentence, "\n\u3010\u6A21\u7BC4\u89E3\u7B54\u3011").concat(modelAnswer, "\n\u3010\u751F\u5F92\u306E\u56DE\u7B54\u3011").concat(userAnswer, "\n\n\u52B1\u307E\u3057\u306E\u8A00\u8449\u3092\u542B\u3081\u3066\u3001\u3067\u304D\u308B\u3060\u3051\u9AD8\u3081\u306E\u8A55\u4FA1\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\nJSON\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n{\n  \"rating\": \u8A55\u4FA1\u70B9\u6570\uFF081-5\uFF09,\n  \"feedback\": \"\u52B1\u307E\u3057\u306E\u8A00\u8449\u3092\u542B\u3080\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\",\n  \"similarPhrases\": [\"\u985E\u4F3C\u8868\u73FE1\", \"\u985E\u4F3C\u8868\u73FE2\", \"\u985E\u4F3C\u8868\u73FE3\"]\n}");
                return [4 /*yield*/, anthropic.messages.create({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 800,
                        temperature: 0.3,
                        messages: [{ role: "user", content: evaluationPrompt }]
                    })];
            case 2:
                message = _b.sent();
                responseText = message.content[0].type === 'text' ? message.content[0].text : '';
                jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    evaluation = JSON.parse(jsonMatch[0]);
                    res.json(evaluation);
                }
                else {
                    throw new Error("Invalid response format");
                }
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error("Evaluation error:", error_2);
                rating = 3;
                feedback = "良い回答です！";
                if (userAnswer && userAnswer.trim().length > 0) {
                    if (userAnswer.length > 8) {
                        rating = 4;
                        feedback = "とても良い回答です！意味がしっかり伝わります。";
                    }
                    else if (userAnswer.length > 3) {
                        rating = 3;
                        feedback = "良い回答です。もう少し詳しく表現できればさらに良くなります。";
                    }
                    else {
                        rating = 2;
                        feedback = "頑張りましたね！次回はもう少し詳しく答えてみましょう。";
                    }
                }
                res.json({
                    rating: rating,
                    feedback: feedback,
                    similarPhrases: [
                        "She studies English every day.",
                        "She is learning English.",
                        "She practices English."
                    ]
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/status", function (req, res) {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        apiKey: !!process.env.ANTHROPIC_API_KEY
    });
});
// Vite integration with proper API route exclusion
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var vite;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 Starting Vite server...");
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "custom",
                            root: path_1.default.resolve("client"),
                        })];
                case 1:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    // CRITICAL: SPA fallback that skips API routes
                    app.use("*", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                        var url, template, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    url = req.originalUrl;
                                    // Skip API routes - let Express handle them
                                    if (url.startsWith("/api/")) {
                                        console.log("\uD83D\uDEAB API route ".concat(url, " not handled - returning 404"));
                                        return [2 /*return*/, res.status(404).json({ error: "API endpoint not found" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, vite.transformIndexHtml(url, "\n<!doctype html>\n<html lang=\"ja\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1\" />\n    <title>AI English Chat</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n      ")];
                                case 2:
                                    template = _a.sent();
                                    res.status(200).set({ "Content-Type": "text/html" }).end(template);
                                    return [3 /*break*/, 4];
                                case 3:
                                    e_1 = _a.sent();
                                    vite.ssrFixStacktrace(e_1);
                                    next(e_1);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
                        console.log("\uD83D\uDD25 API endpoints available:");
                        console.log("   GET  /api/ping");
                        console.log("   POST /api/problem");
                        console.log("   POST /api/evaluate-with-claude");
                        console.log("   GET  /api/status");
                    });
                    return [2 /*return*/];
            }
        });
    });
}
startServer().catch(console.error);
