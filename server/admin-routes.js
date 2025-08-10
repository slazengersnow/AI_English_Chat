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
exports.registerAdminRoutes = registerAdminRoutes;
function registerAdminRoutes(app) {
    var _this = this;
    // Usage Statistics
    app.get("/api/admin/usage-stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var usageStats;
        return __generator(this, function (_a) {
            try {
                usageStats = {
                    todayUsers: Math.floor(Math.random() * 150) + 50,
                    todayProblems: Math.floor(Math.random() * 500) + 200,
                    categoryStats: {
                        "TOEIC": Math.floor(Math.random() * 100) + 50,
                        "中学英語": Math.floor(Math.random() * 80) + 40,
                        "高校英語": Math.floor(Math.random() * 60) + 30,
                        "基本動詞": Math.floor(Math.random() * 40) + 20,
                        "ビジネスメール": Math.floor(Math.random() * 70) + 35,
                        "シミュレーション練習": Math.floor(Math.random() * 30) + 15
                    },
                    realtimeConnections: Math.floor(Math.random() * 25) + 5
                };
                res.json(usageStats);
            }
            catch (error) {
                console.error("Failed to get usage stats:", error);
                res.status(500).json({ error: "Failed to get usage statistics" });
            }
            return [2 /*return*/];
        });
    }); });
    // Subscription Information  
    app.get("/api/admin/subscription-info", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var subscriptionInfo;
        return __generator(this, function (_a) {
            try {
                subscriptionInfo = {
                    activeSubscribers: Math.floor(Math.random() * 50) + 20,
                    trialUsers: Math.floor(Math.random() * 30) + 10,
                    monthlyRevenue: Math.floor(Math.random() * 100000) + 50000
                };
                res.json(subscriptionInfo);
            }
            catch (error) {
                console.error("Failed to get subscription info:", error);
                res.status(500).json({ error: "Failed to get subscription information" });
            }
            return [2 /*return*/];
        });
    }); });
    // Users List
    app.get("/api/admin/users", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var users, i;
        return __generator(this, function (_a) {
            try {
                users = [];
                for (i = 0; i < 25; i++) {
                    users.push({
                        id: "user_".concat(i + 1),
                        email: "user".concat(i + 1, "@example.com"),
                        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                        subscriptionStatus: ['active', 'trial', 'inactive'][Math.floor(Math.random() * 3)],
                        lastActive: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null
                    });
                }
                res.json(users);
            }
            catch (error) {
                console.error("Failed to get users:", error);
                res.status(500).json({ error: "Failed to get users list" });
            }
            return [2 /*return*/];
        });
    }); });
    // System Status
    app.get("/api/admin/system-status", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var status_1;
        return __generator(this, function (_a) {
            try {
                status_1 = {
                    claudeApi: 'healthy',
                    stripeApi: 'healthy',
                    database: 'healthy',
                    lastUpdated: new Date().toLocaleString('ja-JP')
                };
                // Check Claude API
                try {
                    if (!process.env.ANTHROPIC_API_KEY) {
                        status_1.claudeApi = 'down';
                    }
                }
                catch (_b) {
                    status_1.claudeApi = 'degraded';
                }
                // Check Stripe API
                try {
                    if (!process.env.STRIPE_SECRET_KEY) {
                        status_1.stripeApi = 'down';
                    }
                }
                catch (_c) {
                    status_1.stripeApi = 'degraded';
                }
                res.json(status_1);
            }
            catch (error) {
                console.error("Failed to get system status:", error);
                res.status(500).json({ error: "Failed to get system status" });
            }
            return [2 /*return*/];
        });
    }); });
    // Send Notification
    app.post("/api/admin/send-notification", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var message;
        return __generator(this, function (_a) {
            try {
                message = req.body.message;
                if (!message || message.trim().length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "Message is required" })];
                }
                // Log the notification (in a real app, you'd store this in DB and push to users)
                console.log("\uD83D\uDCE2 Admin Notification: ".concat(message));
                // TODO: Implement actual notification system (WebSocket, email, push notifications)
                res.json({ success: true, message: "Notification sent successfully" });
            }
            catch (error) {
                console.error("Failed to send notification:", error);
                res.status(500).json({ error: "Failed to send notification" });
            }
            return [2 /*return*/];
        });
    }); });
    // User Statistics
    app.get("/api/user/stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var stats;
        return __generator(this, function (_a) {
            try {
                stats = {
                    totalProblems: Math.floor(Math.random() * 500) + 100,
                    averageRating: Math.random() * 2 + 3, // 3-5 range
                    streakDays: Math.floor(Math.random() * 30) + 1,
                    favoriteCategory: ["TOEIC", "中学英語", "高校英語"][Math.floor(Math.random() * 3)],
                    monthlyProgress: Math.floor(Math.random() * 80) + 20, // 20-100%
                    dailyGoal: 30,
                    weeklyStats: [
                        { day: "月", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "火", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "水", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "木", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "金", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "土", problems: Math.floor(Math.random() * 40) + 10 },
                        { day: "日", problems: Math.floor(Math.random() * 40) + 10 }
                    ]
                };
                res.json(stats);
            }
            catch (error) {
                console.error("Failed to get user stats:", error);
                res.status(500).json({ error: "Failed to get user statistics" });
            }
            return [2 /*return*/];
        });
    }); });
    // User Bookmarks
    app.get("/api/user/bookmarks", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var bookmarks, i;
        return __generator(this, function (_a) {
            try {
                bookmarks = [];
                for (i = 0; i < Math.floor(Math.random() * 10) + 3; i++) {
                    bookmarks.push({
                        id: "bookmark_".concat(i + 1),
                        japaneseSentence: "このプロジェクトの進捗を報告してください。",
                        userTranslation: "Please report this project progress.",
                        correctTranslation: "Please report the progress of this project.",
                        rating: Math.floor(Math.random() * 3) + 3,
                        category: ["TOEIC", "ビジネスメール"][Math.floor(Math.random() * 2)],
                        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }
                res.json(bookmarks);
            }
            catch (error) {
                console.error("Failed to get bookmarks:", error);
                res.status(500).json({ error: "Failed to get bookmarks" });
            }
            return [2 /*return*/];
        });
    }); });
    // Export User Data
    app.get("/api/user/export-data", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var exportData;
        return __generator(this, function (_a) {
            try {
                exportData = {
                    user: {
                        exportDate: new Date().toISOString(),
                        totalProblems: Math.floor(Math.random() * 500) + 100
                    },
                    statistics: {
                        averageRating: Math.random() * 2 + 3,
                        streakDays: Math.floor(Math.random() * 30) + 1,
                        categoryStats: {
                            "TOEIC": Math.floor(Math.random() * 100),
                            "中学英語": Math.floor(Math.random() * 80),
                            "高校英語": Math.floor(Math.random() * 60)
                        }
                    },
                    sessions: [],
                    bookmarks: []
                };
                res.json(exportData);
            }
            catch (error) {
                console.error("Failed to export data:", error);
                res.status(500).json({ error: "Failed to export user data" });
            }
            return [2 /*return*/];
        });
    }); });
    // User Subscription Status
    app.get("/api/user/subscription", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var subscription;
        return __generator(this, function (_a) {
            try {
                subscription = {
                    status: ['trial', 'active', 'inactive'][Math.floor(Math.random() * 3)],
                    plan: 'standard',
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
                res.json(subscription);
            }
            catch (error) {
                console.error("Failed to get subscription:", error);
                res.status(500).json({ error: "Failed to get subscription status" });
            }
            return [2 /*return*/];
        });
    }); });
    // Remove Bookmark
    app.delete("/api/user/bookmarks/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            try {
                id = req.params.id;
                // Mock bookmark removal - replace with actual database operations
                console.log("Removing bookmark: ".concat(id));
                res.json({ success: true, message: "Bookmark removed successfully" });
            }
            catch (error) {
                console.error("Failed to remove bookmark:", error);
                res.status(500).json({ error: "Failed to remove bookmark" });
            }
            return [2 /*return*/];
        });
    }); });
}
