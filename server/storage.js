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
exports.storage = exports.Storage = void 0;
var postgres_js_1 = require("drizzle-orm/postgres-js");
var drizzle_orm_1 = require("drizzle-orm");
var postgres_1 = require("postgres");
var schema = require("../shared/schema.js");
var trainingSessions = schema.trainingSessions, userGoals = schema.userGoals, dailyProgress = schema.dailyProgress, customScenarios = schema.customScenarios;
// Database connection
var connectionString = process.env.DATABASE_URL;
var client = (0, postgres_1.default)(connectionString);
var db = (0, postgres_js_1.drizzle)(client, { schema: schema });
// CRITICAL: Daily limit system - In-memory counter
var DAILY_LIMIT = 100;
var dailyCounters = new Map();
function getTodayString() {
    return new Date().toISOString().split("T")[0];
}
function getDailyCount(userId) {
    if (userId === void 0) { userId = "bizmowa.com"; }
    var today = getTodayString();
    var counter = dailyCounters.get(userId);
    if (!counter || counter.date !== today) {
        // Reset counter for new day
        dailyCounters.set(userId, { count: 0, date: today });
        return 0;
    }
    return counter.count;
}
function incrementDailyCountInternal(userId) {
    if (userId === void 0) { userId = "bizmowa.com"; }
    var today = getTodayString();
    var counter = dailyCounters.get(userId);
    if (!counter || counter.date !== today) {
        // New day, reset counter
        dailyCounters.set(userId, { count: 1, date: today });
        console.log("\u2705 Problem count: 1/".concat(DAILY_LIMIT, " for ").concat(userId));
        return true;
    }
    if (counter.count >= DAILY_LIMIT) {
        console.log("\uD83D\uDED1 Daily limit (".concat(DAILY_LIMIT, ") reached - returning 429"));
        return false;
    }
    counter.count++;
    dailyCounters.set(userId, counter);
    console.log("\u2705 Problem count: ".concat(counter.count, "/").concat(DAILY_LIMIT, " for ").concat(userId));
    return true;
}
function resetDailyCount(userId) {
    if (userId === void 0) { userId = "bizmowa.com"; }
    console.log("🔄 Resetting daily count for user:", userId);
    dailyCounters.delete(userId);
}
var Storage = /** @class */ (function () {
    function Storage() {
    }
    // Training sessions
    Storage.prototype.getTrainingSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(trainingSessions)
                            .orderBy((0, drizzle_orm_1.desc)(trainingSessions.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.getTrainingSession = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(trainingSessions)
                            .where((0, drizzle_orm_1.eq)(trainingSessions.id, parseInt(id)))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0] || null];
                }
            });
        });
    };
    Storage.prototype.createTrainingSession = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(trainingSessions).values(data).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    Storage.prototype.updateTrainingSession = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(trainingSessions)
                            .set(data)
                            .where((0, drizzle_orm_1.eq)(trainingSessions.id, parseInt(id)))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    Storage.prototype.deleteTrainingSession = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(trainingSessions)
                            .where((0, drizzle_orm_1.eq)(trainingSessions.id, parseInt(id)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Low-rated and review sessions
    Storage.prototype.getLowRatedSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(trainingSessions)
                            .orderBy((0, drizzle_orm_1.desc)(trainingSessions.createdAt))
                            .limit(50)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.getBookmarkedSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(trainingSessions)
                            .orderBy((0, drizzle_orm_1.desc)(trainingSessions.createdAt))
                            .limit(50)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.updateReviewCount = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    // Removed duplicate method
    // CRITICAL: Daily limit functions
    Storage.prototype.incrementDailyCount = function () {
        return __awaiter(this, arguments, void 0, function (userId) {
            if (userId === void 0) { userId = "bizmowa.com"; }
            return __generator(this, function (_a) {
                return [2 /*return*/, incrementDailyCountInternal(userId)];
            });
        });
    };
    Storage.prototype.getDailyCount = function () {
        return __awaiter(this, arguments, void 0, function (userId) {
            if (userId === void 0) { userId = "bizmowa.com"; }
            return __generator(this, function (_a) {
                return [2 /*return*/, getDailyCount(userId)];
            });
        });
    };
    // Missing methods that routes.ts expects
    Storage.prototype.getUserSubscription = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { subscriptionStatus: "active", subscriptionType: "standard", isAdmin: false }];
            });
        });
    };
    Storage.prototype.updateUserSubscription = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, __assign(__assign({}, data), { userId: userId })];
            });
        });
    };
    Storage.prototype.getUserAttemptedProblems = function (difficulty, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    Storage.prototype.getCurrentProblemNumber = function (userId, difficulty) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, 1];
            });
        });
    };
    Storage.prototype.addTrainingSession = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, __assign({ id: Date.now() }, data)];
            });
        });
    };
    // Additional stub methods for routes.ts compatibility
    Storage.prototype.updateProblemProgress = function (userId, difficulty, progress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    Storage.prototype.getSessionsByDifficulty = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Storage.prototype.updateUserGoals = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.getProgressHistory = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Storage.prototype.getStreakCount = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, 0];
        }); });
    };
    Storage.prototype.getDifficultyStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.getMonthlyStats = function (userId, year) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.getSessionsForReview = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Storage.prototype.getRecentSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Storage.prototype.updateBookmark = function (sessionId, isBookmarked) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    Storage.prototype.addCustomScenario = function (data) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.getTodaysProblemCount = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, 0];
        }); });
    };
    Storage.prototype.getAdminStats = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Storage.prototype.getLearningAnalytics = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        }); });
    };
    Storage.prototype.exportData = function (type) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, ""];
        }); });
    };
    Storage.prototype.resetUserData = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    // Reset daily count for testing
    Storage.prototype.resetDailyCount = function () {
        return __awaiter(this, arguments, void 0, function (userId) {
            if (userId === void 0) { userId = "bizmowa.com"; }
            return __generator(this, function (_a) {
                resetDailyCount(userId);
                return [2 /*return*/];
            });
        });
    };
    // Goals and progress
    Storage.prototype.getUserGoals = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(userGoals).orderBy((0, drizzle_orm_1.desc)(userGoals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.updateUserGoal = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingGoal, result, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(userGoals).limit(1)];
                    case 1:
                        existingGoal = _a.sent();
                        if (!(existingGoal.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, db
                                .update(userGoals)
                                .set(__assign(__assign({}, data), { updatedAt: new Date() }))
                                .returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                    case 3: return [4 /*yield*/, db.insert(userGoals).values(data).returning()];
                    case 4:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    Storage.prototype.getDailyProgress = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var thirtyDaysAgo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return [4 /*yield*/, db
                                .select()
                                .from(dailyProgress)
                                .where((0, drizzle_orm_1.gte)(dailyProgress.date, thirtyDaysAgo.toISOString().split("T")[0]))
                                .orderBy((0, drizzle_orm_1.desc)(dailyProgress.date))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.updateDailyProgress = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var today, existingProgress, result, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = new Date().toISOString().split("T")[0];
                        return [4 /*yield*/, db
                                .select()
                                .from(dailyProgress)
                                .where((0, drizzle_orm_1.eq)(dailyProgress.date, today))
                                .limit(1)];
                    case 1:
                        existingProgress = _a.sent();
                        if (!(existingProgress.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, db
                                .update(dailyProgress)
                                .set(data)
                                .where((0, drizzle_orm_1.eq)(dailyProgress.date, today))
                                .returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                    case 3: return [4 /*yield*/, db
                            .insert(dailyProgress)
                            .values(__assign(__assign({}, data), { date: today }))
                            .returning()];
                    case 4:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    // Custom scenarios
    Storage.prototype.getCustomScenarios = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(customScenarios)
                            .orderBy((0, drizzle_orm_1.desc)(customScenarios.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Storage.prototype.getCustomScenario = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(customScenarios)
                            .where((0, drizzle_orm_1.eq)(customScenarios.id, parseInt(id)))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0] || null];
                }
            });
        });
    };
    Storage.prototype.createCustomScenario = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(customScenarios).values(data).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    Storage.prototype.updateCustomScenario = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(customScenarios)
                            .set(data)
                            .where((0, drizzle_orm_1.eq)(customScenarios.id, parseInt(id)))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    Storage.prototype.deleteCustomScenario = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(customScenarios)
                            .where((0, drizzle_orm_1.eq)(customScenarios.id, parseInt(id)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Storage;
}());
exports.Storage = Storage;
exports.storage = new Storage();
