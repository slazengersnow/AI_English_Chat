var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import { createServer as createServer2 } from "http";
import { fileURLToPath } from "url";
import path2 from "path";
import dotenv from "dotenv";

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";
async function setupVite(app2, server2) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const templatePath = path.resolve(__dirname, "../client/index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname, "../dist/client");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Please run 'npm run build' before start.`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  DIFFICULTY_LEVELS: () => DIFFICULTY_LEVELS,
  checkoutSessionResponseSchema: () => checkoutSessionResponseSchema,
  createCheckoutSessionSchema: () => createCheckoutSessionSchema,
  customScenarios: () => customScenarios,
  dailyProgress: () => dailyProgress,
  exampleTable: () => exampleTable,
  insertCustomScenarioSchema: () => insertCustomScenarioSchema,
  insertDailyProgressSchema: () => insertDailyProgressSchema,
  insertProblemProgressSchema: () => insertProblemProgressSchema,
  insertTrainingSessionSchema: () => insertTrainingSessionSchema,
  insertUserGoalSchema: () => insertUserGoalSchema,
  insertUserSubscriptionSchema: () => insertUserSubscriptionSchema,
  problemProgress: () => problemProgress,
  problemRequestSchema: () => problemRequestSchema,
  problemResponseSchema: () => problemResponseSchema,
  sessions: () => sessions,
  trainingSessionSchema: () => trainingSessionSchema,
  trainingSessions: () => trainingSessions,
  translateRequestSchema: () => translateRequestSchema,
  translateResponseSchema: () => translateResponseSchema,
  userGoals: () => userGoals,
  userSubscriptions: () => userSubscriptions
});
import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  boolean,
  varchar,
  date,
  index,
  unique
} from "drizzle-orm/pg-core";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().default("default_user"),
  difficultyLevel: varchar("difficulty_level").notNull(),
  japaneseSentence: text("japanese_sentence").notNull(),
  userTranslation: text("user_translation").notNull(),
  correctTranslation: text("correct_translation").notNull(),
  feedback: text("feedback").notNull(),
  rating: integer("rating").notNull(),
  isBookmarked: boolean("is_bookmarked").notNull().default(false),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewed: timestamp("last_reviewed"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  dailyGoal: integer("daily_goal").notNull().default(30),
  monthlyGoal: integer("monthly_goal").notNull().default(900),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().default("default_user"),
    subscriptionType: varchar("subscription_type").notNull().default("standard"),
    // "standard" or "premium"
    subscriptionStatus: varchar("subscription_status").notNull().default("inactive"),
    // active, trialing, canceled, past_due, etc.
    planName: varchar("plan_name"),
    // standard_monthly, premium_yearly, etc.
    stripeCustomerId: varchar("stripe_customer_id"),
    stripeSubscriptionId: varchar("stripe_subscription_id"),
    stripeSubscriptionItemId: varchar("stripe_subscription_item_id"),
    // For subscription upgrades
    validUntil: timestamp("valid_until"),
    trialStart: timestamp("trial_start"),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    uniqueUserId: unique().on(table.userId)
  })
);
var dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  problemsCompleted: integer("problems_completed").notNull().default(0),
  averageRating: integer("average_rating").notNull().default(0),
  dailyCount: integer("daily_count").notNull().default(0),
  // Track problems attempted today
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var customScenarios = pgTable("custom_scenarios", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var problemProgress = pgTable(
  "problem_progress",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().default("default_user"),
    difficultyLevel: varchar("difficulty_level").notNull(),
    currentProblemNumber: integer("current_problem_number").notNull().default(1),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    uniqueUserDifficulty: unique().on(table.userId, table.difficultyLevel)
  })
);
var exampleTable = pgTable("example_table", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertTrainingSessionSchema = z.object({
  difficultyLevel: z.string(),
  japaneseSentence: z.string(),
  userTranslation: z.string(),
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number(),
  userId: z.string().optional(),
  isBookmarked: z.boolean().optional(),
  reviewCount: z.number().optional(),
  lastReviewed: z.date().optional()
});
var insertUserGoalSchema = z.object({
  dailyGoal: z.number(),
  monthlyGoal: z.number()
});
var insertDailyProgressSchema = z.object({
  date: z.string(),
  // dateフィールドは文字列形式（YYYY-MM-DD）
  problemsCompleted: z.number(),
  averageRating: z.number(),
  dailyCount: z.number().optional()
});
var insertCustomScenarioSchema = z.object({
  title: z.string(),
  description: z.string(),
  isActive: z.boolean().optional()
});
var insertUserSubscriptionSchema = z.object({
  userId: z.string().optional(),
  subscriptionType: z.string().optional(),
  subscriptionStatus: z.string().optional(),
  planName: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeSubscriptionItemId: z.string().optional(),
  validUntil: z.date().optional(),
  trialStart: z.date().optional(),
  isAdmin: z.boolean().optional()
});
var insertProblemProgressSchema = z.object({
  userId: z.string().optional(),
  difficultyLevel: z.string(),
  currentProblemNumber: z.number().optional()
});
var trainingSessionSchema = z.object({
  id: z.number(),
  difficultyLevel: z.string(),
  japaneseSentence: z.string(),
  userTranslation: z.string(),
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number().min(1).max(5),
  isBookmarked: z.boolean().optional(),
  reviewCount: z.number().optional(),
  lastReviewed: z.date().optional(),
  createdAt: z.date()
});
var translateRequestSchema = z.object({
  japaneseSentence: z.string().min(1),
  userTranslation: z.string().min(1),
  difficultyLevel: z.string()
  // Allow simulation-X format as well as standard difficulty levels
});
var translateResponseSchema = z.object({
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number().min(1).max(5),
  improvements: z.array(z.string()).optional(),
  explanation: z.string(),
  similarPhrases: z.array(z.string()),
  sessionId: z.number().optional()
});
var problemRequestSchema = z.object({
  difficultyLevel: z.enum([
    "toeic",
    "middle-school",
    "high-school",
    "basic-verbs",
    "business-email"
  ])
});
var problemResponseSchema = z.object({
  japaneseSentence: z.string(),
  hints: z.array(z.string()).optional()
});
var createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional()
});
var checkoutSessionResponseSchema = z.object({
  url: z.string(),
  sessionId: z.string()
});
var DIFFICULTY_LEVELS = {
  toeic: {
    name: "TOEIC",
    description: "\u30D3\u30B8\u30CD\u30B9\u82F1\u8A9E\u30FB\u8CC7\u683C\u5BFE\u7B56",
    color: "purple",
    icon: "briefcase"
  },
  "middle-school": {
    name: "\u4E2D\u5B66\u82F1\u8A9E",
    description: "\u57FA\u672C\u7684\u306A\u6587\u6CD5\u3068\u8A9E\u5F59",
    color: "blue",
    icon: "book-open"
  },
  "high-school": {
    name: "\u9AD8\u6821\u82F1\u8A9E",
    description: "\u5FDC\u7528\u6587\u6CD5\u3068\u8868\u73FE",
    color: "green",
    icon: "graduation-cap"
  },
  "basic-verbs": {
    name: "\u57FA\u672C\u52D5\u8A5E",
    description: "\u65E5\u5E38\u52D5\u8A5E\u306E\u4F7F\u3044\u5206\u3051",
    color: "orange",
    icon: "zap"
  },
  "business-email": {
    name: "\u30D3\u30B8\u30CD\u30B9\u30E1\u30FC\u30EB",
    description: "\u5B9F\u52D9\u30E1\u30FC\u30EB\u4F5C\u6210",
    color: "red",
    icon: "mail"
  }
};

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
} else {
  try {
    const { WebSocket: WSWebSocket } = await import("ws");
    neonConfig.webSocketConstructor = WSWebSocket;
  } catch (e) {
    const err = e;
    console.warn("WebSocket setup failed, using HTTP fallback:", err.message);
  }
}
var databaseUrl = process.env.NODE_ENV === "production" ? process.env.DATABASE_URL : process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9AURL\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u74B0\u5883\u5909\u6570 DATABASE_URL \u307E\u305F\u306F DEV_DATABASE_URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
  );
}
console.log("Using database URL:", databaseUrl?.substring(0, 20) + "...");
var pool = new Pool({ connectionString: databaseUrl });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
var DatabaseStorage = class {
  // Training sessions
  async addTrainingSession(sessionData) {
    const [session] = await db.insert(trainingSessions).values({
      difficultyLevel: sessionData.difficultyLevel,
      japaneseSentence: sessionData.japaneseSentence,
      userTranslation: sessionData.userTranslation,
      correctTranslation: sessionData.correctTranslation,
      feedback: sessionData.feedback,
      rating: sessionData.rating,
      userId: sessionData.userId || "default_user"
    }).returning();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    await this.updateDailyProgressForDate(today);
    return {
      ...session,
      difficultyLevel: session.difficultyLevel,
      createdAt: session.createdAt ?? /* @__PURE__ */ new Date(),
      lastReviewed: session.lastReviewed ?? void 0,
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0
    };
  }
  async getTrainingSessions() {
    const sessions2 = await db.select().from(trainingSessions).orderBy(desc(trainingSessions.createdAt));
    return sessions2.map((session) => ({
      ...session,
      createdAt: session.createdAt ?? /* @__PURE__ */ new Date(),
      lastReviewed: session.lastReviewed ?? void 0,
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0
    }));
  }
  async getSessionsByDifficulty(difficultyLevel) {
    const sessions2 = await db.select().from(trainingSessions).where(eq(trainingSessions.difficultyLevel, difficultyLevel)).orderBy(desc(trainingSessions.createdAt));
    return sessions2.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? void 0
    }));
  }
  async updateBookmark(sessionId, isBookmarked) {
    await db.update(trainingSessions).set({ isBookmarked }).where(eq(trainingSessions.id, sessionId));
  }
  async getSessionsForReview(ratingThreshold) {
    const sessions2 = await db.select().from(trainingSessions).where(lte(trainingSessions.rating, ratingThreshold)).orderBy(desc(trainingSessions.createdAt));
    return sessions2.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? void 0
    }));
  }
  async getBookmarkedSessions() {
    const sessions2 = await db.select().from(trainingSessions).where(eq(trainingSessions.isBookmarked, true)).orderBy(desc(trainingSessions.createdAt));
    return sessions2.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? void 0
    }));
  }
  async updateReviewCount(sessionId) {
    await db.update(trainingSessions).set({
      reviewCount: sql`${trainingSessions.reviewCount} + 1`,
      lastReviewed: /* @__PURE__ */ new Date()
    }).where(eq(trainingSessions.id, sessionId));
  }
  async getRecentSessions(daysBack = 7) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const sessions2 = await db.select().from(trainingSessions).where(gte(trainingSessions.createdAt, cutoffDate)).orderBy(desc(trainingSessions.createdAt)).limit(50);
    return sessions2.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? void 0
    }));
  }
  // User goals
  async getUserGoals() {
    const [goal] = await db.select().from(userGoals).orderBy(desc(userGoals.createdAt)).limit(1);
    if (!goal) return void 0;
    return {
      ...goal,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };
  }
  async updateUserGoals(goalData) {
    const [goal] = await db.insert(userGoals).values({
      dailyGoal: goalData.dailyGoal,
      monthlyGoal: goalData.monthlyGoal
    }).returning();
    return {
      ...goal,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };
  }
  // Daily progress
  async getDailyProgress(date2) {
    const [progress] = await db.select().from(dailyProgress).where(eq(dailyProgress.date, date2));
    if (!progress) return void 0;
    return {
      ...progress,
      createdAt: progress.createdAt,
      dailyCount: progress.dailyCount
    };
  }
  async updateDailyProgress(date2, problemsCompleted, averageRating) {
    const [progress] = await db.insert(dailyProgress).values({
      date: date2,
      problemsCompleted,
      averageRating
    }).onConflictDoUpdate({
      target: dailyProgress.date,
      set: {
        problemsCompleted,
        averageRating
      }
    }).returning();
    return {
      ...progress,
      createdAt: progress.createdAt,
      dailyCount: progress.dailyCount
    };
  }
  async updateDailyProgressForDate(date2) {
    const todaySessions = await db.select().from(trainingSessions).where(
      and(
        gte(trainingSessions.createdAt, /* @__PURE__ */ new Date(date2 + "T00:00:00Z")),
        lte(trainingSessions.createdAt, /* @__PURE__ */ new Date(date2 + "T23:59:59Z"))
      )
    );
    if (todaySessions.length > 0) {
      const averageRating = Math.round(
        todaySessions.reduce((sum, session) => sum + session.rating, 0) / todaySessions.length
      );
      await this.updateDailyProgress(date2, todaySessions.length, averageRating);
    }
  }
  async getProgressHistory(startDate, endDate) {
    const progress = await db.select().from(dailyProgress).where(
      and(
        gte(dailyProgress.date, startDate),
        lte(dailyProgress.date, endDate)
      )
    ).orderBy(dailyProgress.date);
    return progress.map((p) => ({
      ...p,
      createdAt: p.createdAt,
      dailyCount: p.dailyCount
    }));
  }
  async getStreakCount() {
    const recent = await db.select({ date: dailyProgress.date }).from(dailyProgress).where(gte(dailyProgress.problemsCompleted, 1)).orderBy(desc(dailyProgress.date)).limit(365);
    let streak = 0;
    const today = /* @__PURE__ */ new Date();
    let checkDate = new Date(today);
    for (const record of recent) {
      const recordDate = new Date(record.date);
      if (recordDate.toDateString() === checkDate.toDateString()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }
  // Daily limit functionality
  async getTodaysProblemCount() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const progress = await this.getDailyProgress(today);
    return progress?.dailyCount || 0;
  }
  async incrementDailyCount() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const currentCount = await this.getTodaysProblemCount();
    if (currentCount >= 100) {
      return false;
    }
    await db.insert(dailyProgress).values({
      date: today,
      dailyCount: currentCount + 1,
      problemsCompleted: 0,
      averageRating: 0
    }).onConflictDoUpdate({
      target: dailyProgress.date,
      set: {
        dailyCount: currentCount + 1
      }
    });
    return true;
  }
  async resetDailyCount(date2) {
    const targetDate = date2 || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    await db.insert(dailyProgress).values({
      date: targetDate,
      dailyCount: 0,
      problemsCompleted: 0,
      averageRating: 0
    }).onConflictDoUpdate({
      target: dailyProgress.date,
      set: {
        dailyCount: 0
      }
    });
  }
  // Custom scenarios
  async getCustomScenarios() {
    const scenarios = await db.select().from(customScenarios).where(eq(customScenarios.isActive, true)).orderBy(desc(customScenarios.createdAt));
    return scenarios.map((scenario) => ({
      ...scenario,
      createdAt: scenario.createdAt ?? /* @__PURE__ */ new Date(),
      isActive: scenario.isActive
    }));
  }
  async getCustomScenario(id) {
    const [scenario] = await db.select().from(customScenarios).where(
      and(eq(customScenarios.id, id), eq(customScenarios.isActive, true))
    );
    if (!scenario) return void 0;
    return {
      ...scenario,
      createdAt: scenario.createdAt ?? /* @__PURE__ */ new Date(),
      isActive: scenario.isActive || true
    };
  }
  async addCustomScenario(scenarioData) {
    const [scenario] = await db.insert(customScenarios).values(scenarioData).returning();
    return {
      ...scenario,
      createdAt: scenario.createdAt ?? /* @__PURE__ */ new Date(),
      isActive: scenario.isActive || true
    };
  }
  async updateCustomScenario(id, scenarioData) {
    const [scenario] = await db.update(customScenarios).set(scenarioData).where(eq(customScenarios.id, id)).returning();
    return {
      ...scenario,
      createdAt: scenario.createdAt ?? /* @__PURE__ */ new Date(),
      isActive: scenario.isActive || true
    };
  }
  async deleteCustomScenario(id) {
    await db.update(customScenarios).set({ isActive: false }).where(eq(customScenarios.id, id));
  }
  // Analytics
  async getDifficultyStats() {
    const stats = await db.select({
      difficulty: trainingSessions.difficultyLevel,
      count: count(),
      averageRating: sql`ROUND(AVG(${trainingSessions.rating}), 1)`
    }).from(trainingSessions).groupBy(trainingSessions.difficultyLevel);
    return stats.map((stat) => ({
      difficulty: stat.difficulty,
      count: Number(stat.count),
      averageRating: Number(stat.averageRating)
    }));
  }
  async getMonthlyStats(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;
    const [stats] = await db.select({
      totalProblems: count(),
      averageRating: sql`ROUND(AVG(${trainingSessions.rating}), 1)`
    }).from(trainingSessions).where(
      and(
        gte(trainingSessions.createdAt, new Date(startDate)),
        lte(trainingSessions.createdAt, new Date(endDate))
      )
    );
    return {
      totalProblems: Number(stats?.totalProblems || 0),
      averageRating: Number(stats?.averageRating || 0)
    };
  }
  async getUserSubscription(userId = "bizmowa.com") {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
    return subscription;
  }
  async updateUserSubscription(userId, subscriptionData) {
    const [subscription] = await db.insert(userSubscriptions).values({
      userId,
      ...subscriptionData
    }).onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        ...subscriptionData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return subscription;
  }
  // Admin functions
  async getAdminStats() {
    const [userCount] = await db.select({ count: count() }).from(userSubscriptions);
    const [sessionCount] = await db.select({ count: count() }).from(trainingSessions);
    const [activeSubscriptions] = await db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.subscriptionType, "premium"));
    return {
      totalUsers: userCount?.count || 0,
      totalSessions: sessionCount?.count || 0,
      activeSubscriptions: activeSubscriptions?.count || 0,
      monthlyActiveUsers: 0
      // Placeholder for now
    };
  }
  async getAllUsers() {
    const users = await db.select().from(userSubscriptions);
    return users.map((user) => ({
      id: user.userId,
      email: user.userId + "@example.com",
      // Placeholder email
      subscriptionType: user.subscriptionType,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastActive: user.updatedAt
    }));
  }
  async getLearningAnalytics() {
    const [sessionCount] = await db.select({ count: count() }).from(trainingSessions);
    const difficultyStats = await db.select({
      difficulty: trainingSessions.difficultyLevel,
      count: count(),
      averageRating: sql`ROUND(AVG(${trainingSessions.rating})::numeric, 1)`
    }).from(trainingSessions).groupBy(trainingSessions.difficultyLevel);
    const monthlyStats = await db.select({
      month: sql`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`,
      sessions: count(),
      averageRating: sql`ROUND(AVG(${trainingSessions.rating})::numeric, 1)`
    }).from(trainingSessions).groupBy(sql`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`).orderBy(sql`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`);
    return {
      totalLearningTime: (sessionCount?.count || 0) * 5,
      // Estimate 5 minutes per session
      totalLearningCount: sessionCount?.count || 0,
      categoryStats: difficultyStats.map((stat) => ({
        category: stat.difficulty,
        correctRate: Math.round(Number(stat.averageRating) / 5 * 100),
        totalAttempts: Number(stat.count)
      })),
      monthlyStats: monthlyStats.map((stat) => ({
        month: stat.month,
        sessions: Number(stat.sessions),
        averageRating: Number(stat.averageRating)
      }))
    };
  }
  async exportData(type) {
    if (type === "users") {
      const users = await this.getAllUsers();
      const headers = "ID,Email,Subscription Type,Is Admin,Created At,Last Active\n";
      const rows = users.map(
        (user) => `${user.id},${user.email},${user.subscriptionType},${user.isAdmin},${user.createdAt},${user.lastActive}`
      ).join("\n");
      return headers + rows;
    } else if (type === "sessions") {
      const sessions2 = await db.select().from(trainingSessions);
      const headers = "ID,Difficulty Level,Japanese Sentence,User Translation,Correct Translation,Rating,Created At\n";
      const rows = sessions2.map(
        (session) => `${session.id},"${session.difficultyLevel}","${session.japaneseSentence.replace(/"/g, '""')}","${session.userTranslation.replace(/"/g, '""')}","${session.correctTranslation.replace(/"/g, '""')}",${session.rating},${session.createdAt.toISOString()}`
      ).join("\n");
      return headers + rows;
    }
    throw new Error("Invalid export type");
  }
  async getUserAttemptedProblems(difficultyLevel, userId = "bizmowa.com") {
    const sessions2 = await db.select({ japaneseSentence: trainingSessions.japaneseSentence }).from(trainingSessions).where(
      and(
        eq(trainingSessions.difficultyLevel, difficultyLevel),
        eq(trainingSessions.userId, userId)
      )
    ).groupBy(trainingSessions.japaneseSentence);
    return sessions2;
  }
  async getCurrentProblemNumber(userId, difficultyLevel) {
    const [progress] = await db.select({ currentProblemNumber: problemProgress.currentProblemNumber }).from(problemProgress).where(
      and(
        eq(problemProgress.userId, userId),
        eq(problemProgress.difficultyLevel, difficultyLevel)
      )
    );
    if (progress) {
      return progress.currentProblemNumber;
    }
    const [sessionCount] = await db.select({ count: sql`count(*)` }).from(trainingSessions).where(
      and(
        eq(trainingSessions.difficultyLevel, difficultyLevel),
        eq(trainingSessions.userId, userId)
      )
    );
    const nextProblemNumber = (sessionCount?.count || 0) + 1;
    await this.updateProblemProgress(
      userId,
      difficultyLevel,
      nextProblemNumber
    );
    return nextProblemNumber;
  }
  async updateProblemProgress(userId, difficultyLevel, problemNumber) {
    await db.insert(problemProgress).values({
      userId,
      difficultyLevel,
      currentProblemNumber: problemNumber
    }).onConflictDoUpdate({
      target: [problemProgress.userId, problemProgress.difficultyLevel],
      set: {
        currentProblemNumber: problemNumber,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async resetUserData(userId = "default_user") {
    await db.delete(trainingSessions);
    await db.delete(dailyProgress);
    await db.delete(userGoals);
    await db.delete(customScenarios);
    await db.delete(problemProgress);
    await db.update(userSubscriptions).set({
      subscriptionType: "trialing",
      trialStart: /* @__PURE__ */ new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
      // 7 days from now
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(userSubscriptions.userId, userId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
var sessionProblems = /* @__PURE__ */ new Map();
function getSessionId(req) {
  return req.sessionID || req.ip || "default";
}
function getUsedProblems(sessionId) {
  if (!sessionProblems.has(sessionId)) {
    sessionProblems.set(sessionId, /* @__PURE__ */ new Set());
  }
  return sessionProblems.get(sessionId);
}
function markProblemAsUsed(sessionId, problem) {
  const usedProblems = getUsedProblems(sessionId);
  usedProblems.add(problem);
}
function getUnusedProblem(sessionId, problems) {
  const usedProblems = getUsedProblems(sessionId);
  const availableProblems = problems.filter((p) => !usedProblems.has(p));
  if (availableProblems.length === 0) {
    sessionProblems.delete(sessionId);
    return problems[Math.floor(Math.random() * problems.length)];
  }
  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}
async function registerRoutes(app2) {
  const requireActiveSubscription = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      let userId = "bizmowa.com";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString()
          );
          if (payload.email) {
            userId = payload.email;
          }
        } catch (jwtError) {
          console.log(
            "JWT parsing failed in middleware, using fallback:",
            jwtError
          );
          const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
          if (userEmail) {
            userId = userEmail;
          }
        }
      }
      console.log(
        "requireActiveSubscription - Checking subscription for user:",
        userId
      );
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
        console.log(
          "requireActiveSubscription - No valid subscription found for user:",
          userId
        );
        return res.status(403).json({
          message: "\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u304C\u5FC5\u8981\u3067\u3059",
          needsSubscription: true
        });
      }
      console.log(
        "requireActiveSubscription - Valid subscription found:",
        subscription
      );
      next();
    } catch (error) {
      console.error("Subscription check error:", error);
      res.status(500).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u78BA\u8A8D\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" });
    }
  };
  const requirePremiumSubscription = async (req, res, next) => {
    try {
      const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
      let userId = "bizmowa.com";
      if (userEmail) {
        userId = userEmail;
      }
      console.log(
        "requirePremiumSubscription - Checking premium subscription for user:",
        userId
      );
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || subscription.subscriptionType !== "premium" || !["active", "trialing"].includes(subscription.subscriptionStatus || "")) {
        console.log(
          "requirePremiumSubscription - No valid premium subscription found for user:",
          userId
        );
        return res.status(403).json({
          message: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u304C\u5FC5\u8981\u3067\u3059",
          needsPremium: true
        });
      }
      console.log(
        "requirePremiumSubscription - Valid premium subscription found:",
        subscription
      );
      next();
    } catch (error) {
      console.error("Premium subscription check error:", error);
      res.status(500).json({ message: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u78BA\u8A8D\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  };
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      await storage.updateUserSubscription("default_user", {
        subscriptionStatus: "inactive",
        userId: "default_user"
      });
      res.json({
        success: true,
        message: "\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u4F5C\u6210\u3055\u308C\u307E\u3057\u305F",
        needsSubscription: true
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const subscription = await storage.getUserSubscription();
      const needsSubscription = !subscription || !["active", "trialing"].includes(subscription.subscriptionStatus || "");
      res.json({
        success: true,
        message: "\u30ED\u30B0\u30A4\u30F3\u3057\u307E\u3057\u305F",
        needsSubscription
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/problem", requireActiveSubscription, async (req, res) => {
    try {
      const canProceed = await storage.incrementDailyCount();
      if (!canProceed) {
        return res.status(429).json({
          message: "\u672C\u65E5\u306E\u6700\u5927\u51FA\u984C\u6570\uFF08100\u554F\uFF09\u306B\u9054\u3057\u307E\u3057\u305F\u3002\u660E\u65E5\u307E\u305F\u5B66\u7FD2\u3092\u518D\u958B\u3067\u304D\u307E\u3059\u3002",
          dailyLimitReached: true
        });
      }
      const { difficultyLevel } = problemRequestSchema.parse(req.body);
      const userId = "bizmowa.com";
      const previousProblems = await storage.getUserAttemptedProblems(
        difficultyLevel,
        userId
      );
      const attemptedSentences = new Set(
        previousProblems.map((p) => p.japaneseSentence)
      );
      const problemSets = {
        toeic: [
          "\u4F1A\u8B70\u306E\u8CC7\u6599\u3092\u6E96\u5099\u3057\u3066\u304A\u3044\u3066\u304F\u3060\u3055\u3044\u3002",
          "\u58F2\u4E0A\u304C\u524D\u5E74\u6BD420%\u5897\u52A0\u3057\u307E\u3057\u305F\u3002",
          "\u65B0\u3057\u3044\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u9032\u6357\u306F\u3044\u304B\u304C\u3067\u3059\u304B\u3002",
          "\u9867\u5BA2\u304B\u3089\u306E\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u691C\u8A0E\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002",
          "\u6765\u9031\u307E\u3067\u306B\u5831\u544A\u66F8\u3092\u63D0\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
          "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u3068\u306E\u6253\u3061\u5408\u308F\u305B\u304C\u4E88\u5B9A\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
          "\u4E88\u7B97\u306E\u898B\u76F4\u3057\u304C\u5FC5\u8981\u3067\u3059\u3002",
          "\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u8ABF\u6574\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u30C1\u30FC\u30E0\u30E1\u30F3\u30D0\u30FC\u3068\u9023\u643A\u3092\u53D6\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
          "\u7D0D\u671F\u306B\u9593\u306B\u5408\u3046\u3088\u3046\u52AA\u529B\u3057\u307E\u3059\u3002",
          "\u54C1\u8CEA\u7BA1\u7406\u306E\u5411\u4E0A\u304C\u8AB2\u984C\u3067\u3059\u3002",
          "\u30DE\u30FC\u30B1\u30C6\u30A3\u30F3\u30B0\u6226\u7565\u3092\u691C\u8A0E\u3057\u3066\u3044\u307E\u3059\u3002",
          "\u7AF6\u5408\u4ED6\u793E\u306E\u52D5\u5411\u3092\u8ABF\u67FB\u3057\u307E\u3057\u305F\u3002",
          "\u4ECA\u56DB\u534A\u671F\u306E\u76EE\u6A19\u3092\u9054\u6210\u3057\u307E\u3057\u305F\u3002",
          "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u9032\u6357\u72B6\u6CC1\u3092\u5831\u544A\u3057\u307E\u3059\u3002"
        ],
        "middle-school": [
          "\u79C1\u306F\u6BCE\u65E5\u5B66\u6821\u306B\u884C\u304D\u307E\u3059\u3002",
          "\u4ECA\u65E5\u306F\u96E8\u304C\u964D\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u5F7C\u5973\u306F\u672C\u3092\u8AAD\u3080\u306E\u304C\u597D\u304D\u3067\u3059\u3002",
          "\u79C1\u305F\u3061\u306F\u6628\u65E5\u6620\u753B\u3092\u898B\u307E\u3057\u305F\u3002",
          "\u660E\u65E5\u53CB\u9054\u3068\u4F1A\u3046\u4E88\u5B9A\u3067\u3059\u3002",
          "\u6628\u65E5\u306F\u56F3\u66F8\u9928\u3067\u52C9\u5F37\u3057\u307E\u3057\u305F\u3002",
          "\u6BCD\u306F\u7F8E\u5473\u3057\u3044\u5915\u98DF\u3092\u4F5C\u3063\u3066\u304F\u308C\u307E\u3059\u3002",
          "\u5144\u306F\u91CE\u7403\u304C\u4E0A\u624B\u3067\u3059\u3002",
          "\u79C1\u306F\u6570\u5B66\u304C\u597D\u304D\u3067\u3059\u3002",
          "\u5148\u751F\u306F\u3068\u3066\u3082\u89AA\u5207\u3067\u3059\u3002",
          "\u590F\u4F11\u307F\u306B\u6D77\u306B\u884C\u304D\u307E\u3057\u305F\u3002",
          "\u72AC\u3068\u6563\u6B69\u3092\u3057\u3066\u3044\u307E\u3059\u3002",
          "\u53CB\u9054\u3068\u516C\u5712\u3067\u904A\u3073\u307E\u3057\u305F\u3002",
          "\u5BBF\u984C\u3092\u5FD8\u308C\u3066\u3057\u307E\u3044\u307E\u3057\u305F\u3002",
          "\u96FB\u8ECA\u3067\u5B66\u6821\u306B\u901A\u3063\u3066\u3044\u307E\u3059\u3002"
        ],
        "high-school": [
          "\u74B0\u5883\u554F\u984C\u306B\u3064\u3044\u3066\u8003\u3048\u308B\u3053\u3068\u306F\u91CD\u8981\u3067\u3059\u3002",
          "\u6280\u8853\u306E\u9032\u6B69\u306B\u3088\u308A\u3001\u79C1\u305F\u3061\u306E\u751F\u6D3B\u306F\u4FBF\u5229\u306B\u306A\u308A\u307E\u3057\u305F\u3002",
          "\u5F7C\u306F\u5C06\u6765\u533B\u8005\u306B\u306A\u308A\u305F\u3044\u3068\u8A00\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u3053\u306E\u672C\u3092\u8AAD\u307F\u7D42\u3048\u305F\u3089\u3001\u611F\u60F3\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002",
          "\u3082\u3057\u6642\u9593\u304C\u3042\u308C\u3070\u3001\u4E00\u7DD2\u306B\u65C5\u884C\u306B\u884C\u304D\u307E\u305B\u3093\u304B\u3002",
          "\u79D1\u5B66\u6280\u8853\u306E\u767A\u5C55\u306F\u793E\u4F1A\u306B\u5927\u304D\u306A\u5F71\u97FF\u3092\u4E0E\u3048\u3066\u3044\u307E\u3059\u3002",
          "\u56FD\u969B\u5316\u304C\u9032\u3080\u4E2D\u3067\u3001\u82F1\u8A9E\u306E\u91CD\u8981\u6027\u304C\u9AD8\u307E\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u5730\u7403\u6E29\u6696\u5316\u306F\u6DF1\u523B\u306A\u554F\u984C\u3068\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u6559\u80B2\u5236\u5EA6\u306E\u6539\u9769\u304C\u8B70\u8AD6\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
          "\u591A\u69D8\u6027\u3092\u8A8D\u3081\u5408\u3046\u3053\u3068\u304C\u5927\u5207\u3067\u3059\u3002",
          "\u6301\u7D9A\u53EF\u80FD\u306A\u793E\u4F1A\u3092\u76EE\u6307\u3059\u3079\u304D\u3067\u3059\u3002",
          "\u6587\u5316\u306E\u9055\u3044\u3092\u7406\u89E3\u3059\u308B\u3053\u3068\u306F\u91CD\u8981\u3067\u3059\u3002",
          "\u5275\u9020\u6027\u3092\u80B2\u3080\u3053\u3068\u304C\u6C42\u3081\u3089\u308C\u3066\u3044\u307E\u3059\u3002",
          "\u60C5\u5831\u793E\u4F1A\u306B\u304A\u3051\u308B\u8AB2\u984C\u306F\u591A\u5C90\u306B\u308F\u305F\u308A\u307E\u3059\u3002",
          "\u82E5\u8005\u306E\u4FA1\u5024\u89B3\u306F\u5909\u5316\u3057\u3066\u3044\u307E\u3059\u3002"
        ],
        "basic-verbs": [
          "\u5F7C\u306F\u6BCE\u671D\u30B3\u30FC\u30D2\u30FC\u3092\u4F5C\u308A\u307E\u3059\u3002",
          "\u5B50\u4F9B\u305F\u3061\u304C\u516C\u5712\u3067\u904A\u3093\u3067\u3044\u307E\u3059\u3002",
          "\u6BCD\u306F\u6599\u7406\u3092\u4F5C\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u79C1\u306F\u53CB\u9054\u306B\u624B\u7D19\u3092\u66F8\u304D\u307E\u3057\u305F\u3002",
          "\u96FB\u8ECA\u304C\u99C5\u306B\u5230\u7740\u3057\u307E\u3057\u305F\u3002",
          "\u732B\u304C\u9B5A\u3092\u98DF\u3079\u3066\u3044\u307E\u3059\u3002",
          "\u7236\u306F\u65B0\u805E\u3092\u8AAD\u3093\u3067\u3044\u307E\u3059\u3002",
          "\u79C1\u306F\u97F3\u697D\u3092\u805E\u3044\u3066\u3044\u307E\u3059\u3002",
          "\u5F7C\u5973\u306F\u82B1\u3092\u690D\u3048\u307E\u3057\u305F\u3002",
          "\u9CE5\u304C\u7A7A\u3092\u98DB\u3093\u3067\u3044\u307E\u3059\u3002",
          "\u5B66\u751F\u304C\u52C9\u5F37\u3057\u3066\u3044\u307E\u3059\u3002",
          "\u533B\u8005\u304C\u60A3\u8005\u3092\u8A3A\u5BDF\u3057\u307E\u3059\u3002",
          "\u96E8\u304C\u964D\u308A\u59CB\u3081\u307E\u3057\u305F\u3002",
          "\u592A\u967D\u304C\u6607\u3063\u3066\u3044\u307E\u3059\u3002",
          "\u98A8\u304C\u5F37\u304F\u5439\u3044\u3066\u3044\u307E\u3059\u3002"
        ],
        "business-email": [
          "\u304A\u4E16\u8A71\u306B\u306A\u3063\u3066\u304A\u308A\u307E\u3059\u3002",
          "\u4F1A\u8B70\u306E\u4EF6\u3067\u3054\u9023\u7D61\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u6DFB\u4ED8\u30D5\u30A1\u30A4\u30EB\u3092\u3054\u67FB\u53CE\u304F\u3060\u3055\u3044\u3002",
          "\u660E\u65E5\u306E\u4F1A\u8B70\u306E\u4EF6\u3067\u30EA\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u304A\u9858\u3044\u3057\u305F\u304F\u5B58\u3058\u307E\u3059\u3002",
          "\u8CC7\u6599\u306E\u4FEE\u6B63\u7248\u3092\u6DFB\u4ED8\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u3054\u78BA\u8A8D\u306E\u307B\u3069\u3001\u3088\u308D\u3057\u304F\u304A\u9858\u3044\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u8AA0\u306B\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u304C\u3001\u6DFB\u4ED8\u30D5\u30A1\u30A4\u30EB\u306B\u4E0D\u5099\u304C\u3054\u3056\u3044\u307E\u3057\u305F\u3002",
          "\u304A\u5FD9\u3057\u3044\u3068\u3053\u308D\u6050\u7E2E\u3067\u3059\u304C\u3001\u3054\u8FD4\u4FE1\u3092\u304A\u5F85\u3061\u3057\u3066\u304A\u308A\u307E\u3059\u3002",
          "\u6765\u9031\u306E\u6253\u3061\u5408\u308F\u305B\u306E\u65E5\u7A0B\u8ABF\u6574\u3092\u3055\u305B\u3066\u3044\u305F\u3060\u304D\u305F\u304F\u5B58\u3058\u307E\u3059\u3002",
          "\u8B70\u4E8B\u9332\u3092\u5171\u6709\u3044\u305F\u3057\u307E\u3059\u3002",
          "Teams\u306E\u30EA\u30F3\u30AF\u3092\u5171\u6709\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u6050\u308C\u5165\u308A\u307E\u3059\u304C\u3001\u671F\u65E5\u306E\u5EF6\u671F\u3092\u304A\u9858\u3044\u3067\u304D\u307E\u3059\u3067\u3057\u3087\u3046\u304B\u3002",
          "\u9032\u6357\u72B6\u6CC1\u306B\u3064\u3044\u3066\u3054\u5831\u544A\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u304A\u624B\u6570\u3067\u3059\u304C\u3001\u3054\u78BA\u8A8D\u3044\u305F\u3060\u3051\u307E\u3059\u3067\u3057\u3087\u3046\u304B\u3002",
          "\u3054\u6307\u6458\u3044\u305F\u3060\u3044\u305F\u70B9\u306B\u3064\u3044\u3066\u4FEE\u6B63\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u898B\u7A4D\u66F8\u3092\u9001\u4ED8\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u5951\u7D04\u66F8\u306E\u4EF6\u3067\u3054\u76F8\u8AC7\u304C\u3042\u308A\u307E\u3059\u3002",
          "\u62C5\u5F53\u8005\u5909\u66F4\u306E\u3054\u6848\u5185\u3092\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u4ECA\u6708\u672B\u307E\u3067\u306B\u3054\u63D0\u51FA\u3092\u304A\u9858\u3044\u3044\u305F\u3057\u307E\u3059\u3002",
          "CC\u3067\u95A2\u4FC2\u8005\u306E\u7686\u69D8\u306B\u3082\u5171\u6709\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u304A\u75B2\u308C\u69D8\u3067\u3057\u305F\u3002\u672C\u65E5\u306F\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3057\u305F\u3002",
          "\u81F3\u6025\u3054\u5BFE\u5FDC\u3044\u305F\u3060\u3051\u307E\u3059\u3067\u3057\u3087\u3046\u304B\u3002",
          "\u5FF5\u306E\u305F\u3081\u3001\u518D\u5EA6\u3054\u9023\u7D61\u3044\u305F\u3057\u307E\u3059\u3002",
          "\u3054\u90FD\u5408\u306E\u826F\u3044\u65E5\u6642\u3092\u304A\u6559\u3048\u304F\u3060\u3055\u3044\u3002",
          "\u5F15\u304D\u7D9A\u304D\u3088\u308D\u3057\u304F\u304A\u9858\u3044\u3044\u305F\u3057\u307E\u3059\u3002"
        ]
      };
      const currentProblemNumber = await storage.getCurrentProblemNumber(
        userId,
        difficultyLevel
      );
      const allSentences = problemSets[difficultyLevel];
      const availableSentences = allSentences.filter(
        (sentence) => !attemptedSentences.has(sentence)
      );
      const sentences = availableSentences.length > 0 ? availableSentences : allSentences;
      const sessionId = getSessionId(req);
      const selectedSentence = getUnusedProblem(sessionId, sentences);
      if (!selectedSentence) {
        return res.status(500).json({ message: "No problems available" });
      }
      markProblemAsUsed(sessionId, selectedSentence);
      const response = {
        japaneseSentence: selectedSentence,
        hints: [`\u554F\u984C${currentProblemNumber}`]
      };
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.post("/api/translate", async (req, res) => {
    try {
      const { japaneseSentence, userTranslation, difficultyLevel } = translateRequestSchema.parse(req.body);
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        return res.status(500).json({ message: "Anthropic API key not configured" });
      }
      const systemPrompt = `\u3042\u306A\u305F\u306F\u65E5\u672C\u4EBA\u306E\u82F1\u8A9E\u5B66\u7FD2\u8005\u5411\u3051\u306E\u82F1\u8A9E\u6559\u5E2B\u3067\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u306E\u65E5\u672C\u8A9E\u304B\u3089\u82F1\u8A9E\u3078\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3001\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8FD4\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u91CD\u8981\uFF1A\u3059\u3079\u3066\u306E\u8AAC\u660E\u3068\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306F\u5FC5\u305A\u65E5\u672C\u8A9E\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002

{
  "correctTranslation": "\u6B63\u3057\u3044\u82F1\u8A33\uFF08\u30CD\u30A4\u30C6\u30A3\u30D6\u304C\u81EA\u7136\u306B\u4F7F\u3046\u8868\u73FE\uFF09",
  "feedback": "\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\uFF08\u826F\u3044\u70B9\u3068\u6539\u5584\u70B9\u3092\u65E5\u672C\u8A9E\u3067\uFF09",
  "rating": \u8A55\u4FA1\uFF081=\u8981\u6539\u5584\u30015=\u5B8C\u74A7\u306E\u6570\u5024\uFF09,
  "improvements": ["\u6539\u5584\u63D0\u68481\uFF08\u65E5\u672C\u8A9E\u3067\uFF09", "\u6539\u5584\u63D0\u68482\uFF08\u65E5\u672C\u8A9E\u3067\uFF09"],
  "explanation": "\u6587\u6CD5\u3084\u8A9E\u5F59\u306E\u8A73\u3057\u3044\u89E3\u8AAC\uFF08\u5FC5\u305A\u65E5\u672C\u8A9E\u3067\uFF09",
  "similarPhrases": ["\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA1", "\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA2"]
}

\u8A55\u4FA1\u57FA\u6E96\uFF1A
- \u82F1\u6587\u306F\u30B7\u30F3\u30D7\u30EB\u3067\u5B9F\u7528\u7684\uFF08TOEIC700\u301C800\u30EC\u30D9\u30EB\uFF09
- \u76F4\u8A33\u3067\u306F\u306A\u304F\u81EA\u7136\u306A\u82F1\u8A9E
- feedback\u3001improvements\u3001explanation\u306F\u3059\u3079\u3066\u65E5\u672C\u8A9E\u3067\u8AAC\u660E
- \u4E2D\u5B66\u751F\u3084\u9AD8\u6821\u751F\u306B\u3082\u5206\u304B\u308A\u3084\u3059\u3044\u65E5\u672C\u8A9E\u306E\u89E3\u8AAC`;
      const userPrompt = `\u65E5\u672C\u8A9E\u6587: ${japaneseSentence}
\u30E6\u30FC\u30B6\u30FC\u306E\u82F1\u8A33: ${userTranslation}

\u4E0A\u8A18\u306E\u7FFB\u8A33\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
      try {
        console.log("Attempting translation with Anthropic SDK...");
        console.log(
          "API Key format check:",
          anthropicApiKey.substring(0, 10) + "..."
        );
        const anthropic = new Anthropic({
          apiKey: anthropicApiKey
        });
        console.log("Creating message with model: claude-3-haiku-20240307");
        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          // Use Claude 3 Haiku for low cost and high performance
          max_tokens: 1e3,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        });
        console.log("Anthropic SDK Response received successfully");
        console.log("Response type:", typeof message);
        console.log("Message content length:", message.content.length);
        const content = message.content[0];
        let responseText = "";
        if (content.type === "text") {
          responseText = content.text;
          console.log("Raw response text:", responseText);
        } else {
          console.error(
            "Unexpected response type from Anthropic:",
            content.type
          );
          throw new Error("Unexpected response type from Anthropic");
        }
        let parsedResult;
        try {
          parsedResult = JSON.parse(responseText);
          console.log("Successfully parsed JSON response");
        } catch (parseError) {
          const err = parseError;
          console.error("JSON parse error:", err.message);
          console.error("Response text that failed to parse:", responseText);
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsedResult = JSON.parse(jsonMatch[0]);
              console.log(
                "Successfully extracted and parsed JSON from response"
              );
            } catch (secondParseError) {
              const err2 = secondParseError;
              console.error(
                "Second JSON parse attempt failed:",
                err2.message
              );
              throw new Error("Failed to parse Claude response as JSON");
            }
          } else {
            throw new Error("No valid JSON found in Claude response");
          }
        }
        const response = {
          correctTranslation: parsedResult.correctTranslation || "Translation evaluation failed",
          feedback: parsedResult.feedback || "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
          rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
          improvements: parsedResult.improvements || [],
          explanation: parsedResult.explanation || "",
          similarPhrases: parsedResult.similarPhrases || []
        };
        console.log("Processed response:", {
          correctTranslation: response.correctTranslation,
          rating: response.rating,
          feedbackLength: response.feedback.length
        });
        const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
        const userId = userEmail || "bizmowa.com";
        const trainingSession = await storage.addTrainingSession({
          userId,
          difficultyLevel,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating
        });
        const currentProblemNumber = await storage.getCurrentProblemNumber(
          userId,
          difficultyLevel
        );
        await storage.updateProblemProgress(
          userId,
          difficultyLevel,
          currentProblemNumber + 1
        );
        const responseWithSessionId = {
          ...response,
          sessionId: trainingSession.id
        };
        console.log("Translation evaluation completed successfully");
        res.json(responseWithSessionId);
      } catch (sdkError) {
        console.error("Anthropic SDK error:", sdkError);
        console.error("Error details:", sdkError.message);
        console.log("Falling back to direct API call...");
        try {
          const anthropicResponse = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "x-api-key": anthropicApiKey,
                // Correct header for Anthropic
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                // Use Claude 3 Haiku for low cost and high performance
                max_tokens: 1e3,
                temperature: 0.7,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }]
              })
            }
          );
          console.log("Direct API Response Status:", anthropicResponse.status);
          if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            console.error("Direct API Error Details:", errorText);
            throw new Error(
              `Direct API error: ${anthropicResponse.status} - ${errorText}`
            );
          }
          const anthropicData = await anthropicResponse.json();
          console.log(
            "Direct API response structure:",
            Object.keys(anthropicData)
          );
          const content = anthropicData.content[0].text;
          console.log("Direct API content:", content);
          let parsedResult;
          try {
            parsedResult = JSON.parse(content);
            console.log("Successfully parsed direct API JSON response");
          } catch (parseError) {
            const err = parseError;
            console.error("Direct API JSON parse error:", err.message);
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedResult = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No valid JSON found in direct API response");
            }
          }
          const response = {
            correctTranslation: parsedResult.correctTranslation || "Direct API translation failed",
            feedback: parsedResult.feedback || "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
            rating: Math.max(1, Math.min(5, parsedResult.rating || 3)),
            improvements: parsedResult.improvements || [],
            explanation: parsedResult.explanation || "",
            similarPhrases: parsedResult.similarPhrases || []
          };
          const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
          const userId = userEmail || "bizmowa.com";
          const trainingSession = await storage.addTrainingSession({
            userId,
            difficultyLevel,
            japaneseSentence,
            userTranslation,
            correctTranslation: response.correctTranslation,
            feedback: response.feedback,
            rating: response.rating
          });
          const currentProblemNumber = await storage.getCurrentProblemNumber(
            userId,
            difficultyLevel
          );
          await storage.updateProblemProgress(
            userId,
            difficultyLevel,
            currentProblemNumber + 1
          );
          const responseWithSessionId = {
            ...response,
            sessionId: trainingSession.id
          };
          console.log("Direct API call completed successfully");
          res.json(responseWithSessionId);
        } catch (directApiError) {
          const err = directApiError;
          console.error("Direct API error:", err.message);
          console.log(
            "All API methods failed, providing context-aware response"
          );
          const basicResponse = {
            correctTranslation: `Please try again. The system is currently experiencing issues.`,
            feedback: `\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002\u73FE\u5728AI\u8A55\u4FA1\u30B7\u30B9\u30C6\u30E0\u306B\u4E00\u6642\u7684\u306A\u554F\u984C\u304C\u767A\u751F\u3057\u3066\u3044\u307E\u3059\u3002\u304A\u7B54\u3048\u3044\u305F\u3060\u3044\u305F\u300C${userTranslation}\u300D\u306B\u3064\u3044\u3066\u306F\u3001\u30B7\u30B9\u30C6\u30E0\u5FA9\u65E7\u5F8C\u306B\u518D\u5EA6\u8A55\u4FA1\u3044\u305F\u3057\u307E\u3059\u3002`,
            rating: 3,
            improvements: [
              "\u30B7\u30B9\u30C6\u30E0\u5FA9\u65E7\u3092\u304A\u5F85\u3061\u304F\u3060\u3055\u3044",
              "\u3057\u3070\u3089\u304F\u3057\u3066\u304B\u3089\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044"
            ],
            explanation: "\u30B7\u30B9\u30C6\u30E0\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u4E2D\u306E\u305F\u3081\u3001\u8A73\u7D30\u306A\u8A55\u4FA1\u304C\u3067\u304D\u307E\u305B\u3093\u3002\u3054\u4E0D\u4FBF\u3092\u304A\u304B\u3051\u3057\u3066\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002",
            similarPhrases: [
              "Please wait for system recovery.",
              "System maintenance in progress."
            ]
          };
          console.log("Sending fallback response");
          res.json({ ...basicResponse, sessionId: 0 });
        }
      }
    } catch (error) {
      const err = error;
      console.error("Translation error:", err.message);
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.get("/api/stripe-prices", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeSecretKey);
      const prices = await stripe.prices.list({ limit: 50 });
      const formattedPrices = prices.data.map((price) => ({
        id: price.id,
        product: price.product,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring,
        type: price.type
      }));
      res.json({
        account_type: stripeSecretKey.startsWith("sk_test_") ? "TEST" : stripeSecretKey.startsWith("sk_live_") ? "LIVE" : "UNKNOWN",
        total_prices: prices.data.length,
        prices: formattedPrices
      });
    } catch (error) {
      const err = error;
      console.error("Error fetching Stripe prices:", err.message);
      res.status(500).json({
        message: "Stripe\u4FA1\u683C\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
        error: err.message
      });
    }
  });
  const priceConfig = {
    test: {
      standard_monthly: "price_1RjslTHridtc6DvMCNUU778G",
      standard_yearly: "price_1RjsmiHridtc6DvMWQXBcaJ1",
      premium_monthly: "price_1RjslwHridtc6DvMshQinr44",
      premium_yearly: "price_1Rjsn6Hridtc6DvMGQJaqBid"
    },
    production: {
      standard_monthly: "price_1ReXHSHridtc6DvMOjCbo2VK",
      standard_yearly: "price_1ReXOGHridtc6DvM8L2KO7KO",
      premium_monthly: "price_1ReXP9Hridtc6DvMpgawL58K",
      premium_yearly: "price_1ReXPnHridtc6DvMQaW7NC6w"
    }
  };
  app2.get("/api/subscription-plans", (req, res) => {
    const currentMode = process.env.STRIPE_MODE || "test";
    const currentPrices = priceConfig[currentMode];
    const plans = {
      standard_monthly: {
        priceId: currentPrices.standard_monthly,
        name: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u6708\u984D",
        price: currentMode === "test" ? "\xA50/\u6708 (\u30C6\u30B9\u30C8)" : "\xA5980/\u6708",
        features: ["\u57FA\u672C\u6A5F\u80FD", "1\u65E550\u554F\u307E\u3067", "\u9032\u6357\u8FFD\u8DE1"]
      },
      standard_yearly: {
        priceId: currentPrices.standard_yearly,
        name: "\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u5E74\u4F1A\u8CBB",
        price: currentMode === "test" ? "\xA50/\u5E74 (\u30C6\u30B9\u30C8)" : "\xA59,800/\u5E74 (2\u30F6\u6708\u5206\u304A\u5F97)",
        features: ["\u57FA\u672C\u6A5F\u80FD", "1\u65E550\u554F\u307E\u3067", "\u9032\u6357\u8FFD\u8DE1"]
      },
      premium_monthly: {
        priceId: currentPrices.premium_monthly,
        name: "\u30D7\u30EC\u30DF\u30A2\u30E0\u6708\u984D",
        price: currentMode === "test" ? "\xA50/\u6708 (\u30C6\u30B9\u30C8)" : "\xA51,300/\u6708",
        features: ["\u5168\u6A5F\u80FD", "1\u65E5100\u554F\u307E\u3067", "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA", "\u8A73\u7D30\u5206\u6790"]
      },
      premium_yearly: {
        priceId: currentPrices.premium_yearly,
        name: "\u30D7\u30EC\u30DF\u30A2\u30E0\u5E74\u4F1A\u8CBB",
        price: currentMode === "test" ? "\xA50/\u5E74 (\u30C6\u30B9\u30C8)" : "\xA513,000/\u5E74 (2\u30F6\u6708\u5206\u304A\u5F97)",
        features: ["\u5168\u6A5F\u80FD", "1\u65E5100\u554F\u307E\u3067", "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA", "\u8A73\u7D30\u5206\u6790"]
      },
      upgrade_to_premium: {
        priceId: process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf",
        name: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9",
        price: "\xA52,000/\u6708 (\u5DEE\u984D)",
        features: ["\u30B9\u30BF\u30F3\u30C0\u30FC\u30C9\u304B\u3089\u30D7\u30EC\u30DF\u30A2\u30E0\u3078\u306E\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9"]
      }
    };
    res.json(plans);
  });
  app2.post("/api/stripe/price-info", async (req, res) => {
    try {
      const { priceId } = req.body;
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeSecretKey);
      const price = await stripe.prices.retrieve(priceId);
      res.json({
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        product: price.product,
        active: price.active,
        recurring: price.recurring
      });
    } catch (error) {
      const err = error;
      console.error("Price info error:", err.message);
      res.status(400).json({
        message: error instanceof Error ? err.message : "\u4FA1\u683C\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F"
      });
    }
  });
  app2.post("/api/save-price-configuration", async (req, res) => {
    try {
      const { priceIds } = req.body;
      if (!priceIds || typeof priceIds !== "object") {
        return res.status(400).json({ message: "\u4FA1\u683CID\u60C5\u5831\u304C\u4E0D\u6B63\u3067\u3059" });
      }
      console.log("Saving price configuration:", priceIds);
      if (priceIds.mode) {
        process.env.STRIPE_MODE = priceIds.mode;
        console.log(`Switched to ${priceIds.mode} mode`);
      }
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
        message: "\u4FA1\u683CID\u8A2D\u5B9A\u304C\u4FDD\u5B58\u3055\u308C\u307E\u3057\u305F",
        updatedPrices: priceIds,
        currentMode: process.env.STRIPE_MODE || "test"
      });
    } catch (error) {
      const err = error;
      console.error("Error saving price configuration:", err.message);
      res.status(500).json({ message: "\u4FA1\u683CID\u8A2D\u5B9A\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/plan-configuration", async (req, res) => {
    try {
      const { plans } = req.body;
      const configData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        plans
      };
      console.log("Plan configuration updated:", configData);
      res.json({
        success: true,
        message: "\u30D7\u30E9\u30F3\u8A2D\u5B9A\u304C\u6B63\u5E38\u306B\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",
        updated_count: Object.keys(plans).length
      });
    } catch (error) {
      const err = error;
      console.error("Plan configuration error:", err.message);
      res.status(400).json({
        message: error instanceof Error ? err.message : "\u30D7\u30E9\u30F3\u8A2D\u5B9A\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F"
      });
    }
  });
  app2.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(req.body);
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      console.log(
        "Attempting to create checkout session for priceId:",
        priceId
      );
      console.log(
        "Stripe Secret Key type:",
        stripeSecretKey.startsWith("sk_test_") ? "TEST" : stripeSecretKey.startsWith("sk_live_") ? "LIVE" : "UNKNOWN"
      );
      const stripe = new Stripe(stripeSecretKey);
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log(
          "Price found:",
          price.id,
          "Amount:",
          price.unit_amount,
          "Currency:",
          price.currency
        );
      } catch (priceError) {
        const err = priceError;
        console.error("Price not found:", err.message);
        return res.status(400).json({
          message: `\u4FA1\u683CID "${priceId}" \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002Stripe\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3067\u6B63\u3057\u3044\u4FA1\u683CID\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002`,
          details: err.message
        });
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: successUrl || `${req.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.get("origin")}/payment-cancelled`,
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 7
        },
        metadata: {
          userId: "default_user",
          // In real app, get from authenticated user
          planType: getPlanTypeFromPriceId(priceId)
        }
      });
      const response = {
        url: session.url,
        sessionId: session.id
      };
      res.json(response);
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "\u6C7A\u6E08\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/stripe-prices", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeSecretKey);
      const prices = await stripe.prices.list({
        active: true,
        limit: 100
      });
      const account = await stripe.accounts.retrieve();
      res.json({
        account_type: account.type,
        total_prices: prices.data.length,
        prices: prices.data.map((price) => ({
          id: price.id,
          active: price.active,
          currency: price.currency,
          unit_amount: price.unit_amount,
          type: price.type,
          recurring: price.recurring,
          product: price.product
        }))
      });
    } catch (error) {
      console.error("Stripe prices error:", error);
      res.status(500).json({ message: "\u4FA1\u683C\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  function getPlanTypeFromPriceId(priceId) {
    const currentMode = process.env.STRIPE_MODE || "test";
    const currentPrices = priceConfig[currentMode];
    const standardMonthly = currentPrices.standard_monthly;
    const standardYearly = currentPrices.standard_yearly;
    const premiumMonthly = currentPrices.premium_monthly;
    const premiumYearly = currentPrices.premium_yearly;
    const upgradePremium = process.env.STRIPE_PRICE_UPGRADE_PREMIUM || "prod_SZhAV32kC3oSlf";
    if (priceId === standardMonthly || priceId === standardYearly) {
      return "standard";
    } else if (priceId === premiumMonthly || priceId === premiumYearly || priceId === upgradePremium) {
      return "premium";
    }
    return "standard";
  }
  app2.post("/api/emergency-reset", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      console.log("Emergency password reset requested for:", email);
      const tempPassword = "EmergencyPass123!" + Math.random().toString(36).substring(2, 8);
      const resetSolution = {
        email,
        tempPassword,
        message: "Supabase\u30E1\u30FC\u30EB\u9001\u4FE1\u306E\u554F\u984C\u306B\u3088\u308A\u3001\u7DCA\u6025\u5BFE\u5FDC\u7B56\u3092\u63D0\u4F9B\u3057\u307E\u3059",
        solution: "direct_access",
        steps: [
          "1. \u4EE5\u4E0B\u306E\u60C5\u5831\u3067\u65B0\u3057\u3044\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044",
          "2. \u767B\u9332\u5F8C\u3001\u3059\u3050\u306B\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044",
          "3. \u5FC5\u8981\u306B\u5FDC\u3058\u3066\u3001\u53E4\u3044\u30A2\u30AB\u30A6\u30F3\u30C8\u30C7\u30FC\u30BF\u3092\u79FB\u884C\u3057\u307E\u3059",
          "4. \u3053\u306E\u4E00\u6642\u30D1\u30B9\u30EF\u30FC\u30C9\u306F24\u6642\u9593\u5F8C\u306B\u7121\u52B9\u306B\u306A\u308A\u307E\u3059"
        ],
        credentials: {
          email,
          temporaryPassword: tempPassword
        },
        loginUrl: `${req.protocol}://${req.get("host")}/login`,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString()
      };
      console.log("Emergency credentials created:", resetSolution);
      res.json({
        success: true,
        solution: resetSolution
      });
    } catch (error) {
      console.error("Emergency reset error:", error);
      res.status(500).json({ error: "Emergency reset failed" });
    }
  });
  app2.post("/api/create-subscription", async (req, res) => {
    try {
      const { sessionId, priceId } = req.body;
      if (!sessionId || !priceId) {
        return res.status(400).json({ message: "SessionID and PriceID are required" });
      }
      const planType = getPlanTypeFromPriceId(priceId);
      const userId = "bizmowa.com";
      await storage.updateUserSubscription(userId, {
        subscriptionType: planType,
        subscriptionStatus: "trialing",
        userId,
        stripeCustomerId: `cus_test_${sessionId}`,
        stripeSubscriptionId: `sub_test_${sessionId}`,
        trialStart: /* @__PURE__ */ new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days trial
      });
      console.log(
        `Manual subscription created: ${planType} for session: ${sessionId}`
      );
      res.json({
        success: true,
        message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u304C\u4F5C\u6210\u3055\u308C\u307E\u3057\u305F",
        subscriptionType: planType,
        status: "trialing"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/create-customer-portal", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeSecretKey);
      const customerId = "cus_example123";
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.get("origin")}/my-page?tab=account`
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Customer Portal error:", error);
      res.status(500).json({ message: "\u30AB\u30B9\u30BF\u30DE\u30FC\u30DD\u30FC\u30BF\u30EB\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/subscription-details", async (req, res) => {
    try {
      const userId = "default_user";
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      const trialEndDate = /* @__PURE__ */ new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 5);
      const subscriptionDetails = {
        ...subscription,
        isTrialActive: true,
        trialDaysRemaining: 5,
        trialEndDate: trialEndDate.toISOString(),
        nextBillingDate: "2025-07-27",
        currentPeriodStart: "2025-06-27",
        currentPeriodEnd: "2025-07-27",
        planType: subscription.subscriptionType === "premium" ? "monthly" : "monthly",
        // monthly/yearly
        amount: subscription.subscriptionType === "premium" ? 3980 : 1980
      };
      res.json(subscriptionDetails);
    } catch (error) {
      console.error("Get subscription details error:", error);
      res.status(500).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u8A73\u7D30\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/stripe-webhook", (req, res, next) => {
    req.setEncoding("utf8");
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", async () => {
      req.body = data;
      await handleStripeWebhook(req, res);
    });
  });
  async function handleStripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecretKey) {
      return res.status(400).send(`Webhook Error: Missing Stripe configuration`);
    }
    if (!webhookSecret) {
      console.log(
        "Webhook secret not configured, processing without verification"
      );
      try {
        const event2 = JSON.parse(req.body);
        await processWebhookEvent(event2);
        return res.json({ received: true });
      } catch (error) {
        console.error("Error processing webhook without verification:", error);
        return res.status(400).send("Invalid webhook payload");
      }
    }
    const stripe = new Stripe(stripeSecretKey);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.log(`Webhook signature verification failed.`, errorMessage);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }
    await processWebhookEvent(event);
    res.json({ received: true });
  }
  async function processWebhookEvent(event) {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const planType = getPlanTypeFromPriceId(
          session.line_items?.data[0]?.price?.id || ""
        );
        try {
          const userId = session.metadata?.userId || "bizmowa.com";
          await storage.updateUserSubscription(userId, {
            subscriptionType: planType,
            subscriptionStatus: "trialing",
            // Start with trial
            userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            trialStart: /* @__PURE__ */ new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
            // 7 days trial
          });
          console.log(
            `User subscription updated to ${planType} for session: ${session.id}`
          );
        } catch (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      case "customer.subscription.deleted":
        try {
          await storage.updateUserSubscription("bizmowa.com", {
            subscriptionType: "standard",
            subscriptionStatus: "inactive"
          });
          console.log(`User subscription cancelled`);
        } catch (error) {
          console.error("Error cancelling subscription:", error);
        }
        break;
      case "invoice.payment_succeeded":
        try {
          await storage.updateUserSubscription("bizmowa.com", {
            subscriptionStatus: "active"
          });
          console.log(`User subscription activated after payment`);
        } catch (error) {
          console.error("Error activating subscription:", error);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
  app2.get("/api/sessions", async (req, res) => {
    try {
      const sessions2 = await storage.getTrainingSessions();
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/sessions/:difficulty", async (req, res) => {
    try {
      const { difficulty } = req.params;
      const sessions2 = await storage.getSessionsByDifficulty(difficulty);
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/user-goals", async (req, res) => {
    try {
      const goals = await storage.getUserGoals();
      res.json(goals || { dailyGoal: 30, monthlyGoal: 900 });
    } catch (error) {
      console.error("User goals error:", error);
      res.status(500).json({ message: "\u76EE\u6A19\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/user-goals", async (req, res) => {
    try {
      const { dailyGoal, monthlyGoal } = req.body;
      const goals = await storage.updateUserGoals({ dailyGoal, monthlyGoal });
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "\u76EE\u6A19\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/progress", async (req, res) => {
    try {
      const { period = "week" } = req.query;
      const endDate = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      if (period === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setDate(endDate.getDate() - 1);
      }
      const progress = await storage.getProgressHistory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "\u9032\u6357\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/streak", async (req, res) => {
    try {
      const streak = await storage.getStreakCount();
      res.json({ streak });
    } catch (error) {
      res.status(500).json({ message: "\u9023\u7D9A\u5B66\u7FD2\u65E5\u6570\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/difficulty-stats", async (req, res) => {
    try {
      const stats = await storage.getDifficultyStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "\u30EC\u30D9\u30EB\u5225\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/monthly-stats", async (req, res) => {
    try {
      const year = parseInt(req.query.year) || (/* @__PURE__ */ new Date()).getFullYear();
      const month = parseInt(req.query.month) || (/* @__PURE__ */ new Date()).getMonth() + 1;
      const stats = await storage.getMonthlyStats(year, month);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "\u6708\u9593\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/review-sessions", async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold) || 2;
      const sessions2 = await storage.getSessionsForReview(threshold);
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "\u5FA9\u7FD2\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/recent-sessions", async (req, res) => {
    try {
      const daysBack = parseInt(req.query.days) || 7;
      const sessions2 = await storage.getRecentSessions(daysBack);
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "\u76F4\u8FD1\u306E\u7DF4\u7FD2\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/bookmarked-sessions", async (req, res) => {
    try {
      const sessions2 = await storage.getBookmarkedSessions();
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/sessions/:id/bookmark", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { isBookmarked } = req.body;
      await storage.updateBookmark(sessionId, isBookmarked);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/sessions/:id/review", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.updateReviewCount(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "\u5FA9\u7FD2\u30AB\u30A6\u30F3\u30C8\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/custom-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getCustomScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/user-subscription", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId = "bizmowa.com";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log("Auth token received:", token.substring(0, 20) + "...");
        try {
          const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString()
          );
          if (payload.email) {
            userId = payload.email;
            console.log("Extracted user email from JWT:", userId);
          }
        } catch (jwtError) {
          console.log("JWT parsing failed, using fallback:", jwtError);
          const userEmail = req.headers["x-user-email"] || req.headers["user-email"];
          if (userEmail) {
            userId = userEmail;
          }
        }
      }
      console.log("Getting subscription for user:", userId);
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        console.log("No subscription found for user:", userId);
        return res.json(null);
      }
      console.log("Found subscription:", subscription);
      res.json(subscription);
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/upgrade-subscription", async (req, res) => {
    try {
      const { planType } = req.body;
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const stripe = new Stripe(stripeSecretKey);
      const subscription = await storage.getUserSubscription();
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(400).json({ message: "\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
      }
      const premiumPriceIds = {
        monthly: "price_1ReXP9Hridtc6DvMpgawL58K",
        yearly: "price_1ReXPnHridtc6DvMQaW7NC6w"
      };
      const targetPriceId = premiumPriceIds[planType];
      if (!targetPriceId) {
        return res.status(400).json({ message: "\u7121\u52B9\u306A\u30D7\u30E9\u30F3\u30BF\u30A4\u30D7\u3067\u3059" });
      }
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );
      if (!stripeSubscription.items.data[0]) {
        return res.status(400).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u30A2\u30A4\u30C6\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
      }
      const subscriptionItemId = stripeSubscription.items.data[0].id;
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: subscriptionItemId,
              price: targetPriceId
            }
          ],
          proration_behavior: "create_prorations"
          // 日割り計算を有効化
        }
      );
      await storage.updateUserSubscription(subscription.userId, {
        subscriptionType: "premium",
        stripeSubscriptionItemId: subscriptionItemId,
        planName: planType === "monthly" ? "premium_monthly" : "premium_yearly"
      });
      res.json({
        success: true,
        message: `\u30D7\u30EC\u30DF\u30A2\u30E0${planType === "monthly" ? "\u6708\u984D" : "\u5E74\u9593"}\u30D7\u30E9\u30F3\u306B\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u3057\u307E\u3057\u305F\uFF08\u65E5\u5272\u308A\u8A08\u7B97\u9069\u7528\uFF09`,
        subscriptionId: updatedSubscription.id
      });
    } catch (error) {
      console.error("Upgrade subscription error:", error);
      res.status(500).json({ message: "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/admin/stats", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" });
      }
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "\u7D71\u8A08\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "\u30E6\u30FC\u30B6\u30FC\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/admin/analytics", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" });
      }
      const analytics = await storage.getLearningAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "\u5206\u6790\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/admin/export/:type", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" });
      }
      const { type } = req.params;
      const csvData = await storage.exportData(type);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${type}-export.csv"`
      );
      res.send(csvData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "\u30C7\u30FC\u30BF\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.put("/api/admin/users/:userId/subscription", async (req, res) => {
    try {
      const userSubscription = await storage.getUserSubscription();
      if (!userSubscription?.isAdmin) {
        return res.status(403).json({ message: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" });
      }
      const { userId } = req.params;
      const { subscriptionType } = req.body;
      if (!subscriptionType || !["standard", "premium"].includes(subscriptionType)) {
        return res.status(400).json({
          message: "\u6709\u52B9\u306A\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u30BF\u30A4\u30D7\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044"
        });
      }
      const updatedSubscription = await storage.updateUserSubscription(userId, {
        subscriptionType
      });
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/reset-user-data", async (req, res) => {
    try {
      await storage.resetUserData();
      res.json({ success: true, message: "\u30E6\u30FC\u30B6\u30FC\u30C7\u30FC\u30BF\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F" });
    } catch (error) {
      console.error("Reset user data error:", error);
      res.status(500).json({ message: "\u30C7\u30FC\u30BF\u306E\u30EA\u30BB\u30C3\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post(
    "/api/custom-scenarios",
    requirePremiumSubscription,
    async (req, res) => {
      try {
        const { title, description } = req.body;
        const scenario = await storage.addCustomScenario({
          title,
          description
        });
        res.json(scenario);
      } catch (error) {
        res.status(500).json({ message: "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
      }
    }
  );
  app2.put(
    "/api/custom-scenarios/:id",
    requirePremiumSubscription,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { title, description } = req.body;
        const scenario = await storage.updateCustomScenario(id, {
          title,
          description
        });
        res.json(scenario);
      } catch (error) {
        res.status(500).json({ message: "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
      }
    }
  );
  app2.delete(
    "/api/custom-scenarios/:id",
    requirePremiumSubscription,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteCustomScenario(id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "\u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
      }
    }
  );
  app2.get("/api/custom-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getCustomScenario(id);
      if (!scenario) {
        return res.status(404).json({ message: "\u30B7\u30CA\u30EA\u30AA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "\u30B7\u30CA\u30EA\u30AA\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get(
    "/api/simulation-problem/:scenarioId",
    requirePremiumSubscription,
    async (req, res) => {
      try {
        const scenarioId = parseInt(req.params.scenarioId);
        const scenario = await storage.getCustomScenario(scenarioId);
        if (!scenario) {
          return res.status(404).json({ message: "\u30B7\u30CA\u30EA\u30AA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
        }
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          return res.status(500).json({ message: "Anthropic API key not configured" });
        }
        const prompt = `\u4EE5\u4E0B\u306E\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u8A2D\u5B9A\u306B\u57FA\u3065\u3044\u3066\u3001\u5B9F\u8DF5\u7684\u306A\u65E5\u672C\u8A9E\u6587\u30921\u3064\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3: ${scenario.title}
\u8A73\u7D30: ${scenario.description}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "japaneseSentence": "\u65E5\u672C\u8A9E\u306E\u6587\u7AE0",
  "context": "\u5177\u4F53\u7684\u306A\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u306E\u8AAC\u660E\uFF0820\u6587\u5B57\u4EE5\u5185\uFF09"
}

\u5B9F\u969B\u306E\u5834\u9762\u3067\u4F7F\u308F\u308C\u305D\u3046\u306A\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u6587\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
        try {
          const anthropicResponse = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${anthropicApiKey}`,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 500,
                temperature: 0.8,
                messages: [{ role: "user", content: prompt }]
              })
            }
          );
          if (!anthropicResponse.ok) {
            throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
          }
          const anthropicData = await anthropicResponse.json();
          const result = JSON.parse(anthropicData.content[0].text);
          const sessionId = `${getSessionId(req)}-simulation-${scenarioId}`;
          const usedProblems = getUsedProblems(sessionId);
          if (usedProblems.has(result.japaneseSentence)) {
            const variationPrompt = `${prompt}

\u65E2\u306B\u4F7F\u7528\u3055\u308C\u305F\u554F\u984C: ${Array.from(usedProblems).join(", ")}

\u4E0A\u8A18\u3068\u306F\u7570\u306A\u308B\u65B0\u3057\u3044\u554F\u984C\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
            try {
              const retryResponse = await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${anthropicApiKey}`,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                  },
                  body: JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 500,
                    temperature: 0.9,
                    messages: [{ role: "user", content: variationPrompt }]
                  })
                }
              );
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const retryResult = JSON.parse(retryData.content[0].text);
                markProblemAsUsed(sessionId, retryResult.japaneseSentence);
                return res.json({
                  japaneseSentence: retryResult.japaneseSentence,
                  context: retryResult.context || scenario.description
                });
              }
            } catch (retryError) {
              console.log("Retry generation failed, using original");
            }
          }
          markProblemAsUsed(sessionId, result.japaneseSentence);
          res.json({
            japaneseSentence: result.japaneseSentence,
            context: result.context || scenario.description
          });
        } catch (anthropicError) {
          console.error("Anthropic API error:", anthropicError);
          res.status(500).json({ message: "\u554F\u984C\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
        }
      } catch (error) {
        console.error("Simulation problem error:", error);
        res.status(500).json({ message: "\u554F\u984C\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
      }
    }
  );
  app2.post(
    "/api/simulation-translate",
    requirePremiumSubscription,
    async (req, res) => {
      try {
        const { scenarioId, japaneseSentence, userTranslation, context } = req.body;
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          return res.status(500).json({ message: "Anthropic API key not configured" });
        }
        const scenario = await storage.getCustomScenario(scenarioId);
        if (!scenario) {
          return res.status(404).json({ message: "\u30B7\u30CA\u30EA\u30AA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
        }
        const prompt = `\u3042\u306A\u305F\u306F\u82F1\u8A9E\u6559\u5E2B\u3067\u3059\u3002\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2\u306E\u82F1\u8A33\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u8A2D\u5B9A: ${scenario.title}
\u8A73\u7D30: ${scenario.description}
\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3: ${context}
\u65E5\u672C\u8A9E\u6587: ${japaneseSentence}
\u30E6\u30FC\u30B6\u30FC\u306E\u82F1\u8A33: ${userTranslation}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "correctTranslation": "\u6B63\u3057\u3044\u82F1\u8A33\uFF08\u305D\u306E\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u306B\u6700\u9069\u306A\u8868\u73FE\uFF09",
  "feedback": "\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\uFF08\u826F\u3044\u70B9\u3068\u6539\u5584\u70B9\uFF09",
  "rating": 1\u304B\u30895\u306E\u8A55\u4FA1\uFF081=\u8981\u6539\u5584\u30015=\u5B8C\u74A7\uFF09,
  "improvements": ["\u6539\u5584\u63D0\u68481", "\u6539\u5584\u63D0\u68482"],
  "explanation": "\u305D\u306E\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3\u3067\u306E\u8868\u73FE\u306E\u30DD\u30A4\u30F3\u30C8\uFF08\u65E5\u672C\u8A9E\u3067\uFF09",
  "similarPhrases": ["\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA1", "\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA2"]
}`;
        try {
          const anthropicResponse = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${anthropicApiKey}`,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1e3,
                temperature: 0.7,
                messages: [{ role: "user", content: prompt }]
              })
            }
          );
          if (!anthropicResponse.ok) {
            throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
          }
          const anthropicData = await anthropicResponse.json();
          const parsedResult = JSON.parse(anthropicData.content[0].text);
          const response = {
            correctTranslation: parsedResult.correctTranslation,
            feedback: parsedResult.feedback,
            rating: Math.max(1, Math.min(5, parsedResult.rating)),
            improvements: parsedResult.improvements || [],
            explanation: parsedResult.explanation || "",
            similarPhrases: parsedResult.similarPhrases || []
          };
          await storage.addTrainingSession({
            difficultyLevel: `simulation-${scenarioId}`,
            japaneseSentence,
            userTranslation,
            correctTranslation: response.correctTranslation,
            feedback: response.feedback,
            rating: response.rating
          });
          res.json(response);
        } catch (anthropicError) {
          console.error("Anthropic API error:", anthropicError);
          res.status(500).json({
            message: "AI\u8A55\u4FA1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u3057\u3066\u304B\u3089\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
          });
        }
      } catch (error) {
        console.error("Simulation translation error:", error);
        res.status(500).json({ message: "\u7FFB\u8A33\u8A55\u4FA1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
      }
    }
  );
  app2.get("/api/daily-count", async (req, res) => {
    try {
      const count2 = await storage.getTodaysProblemCount();
      res.json({ count: count2, remaining: Math.max(0, 100 - count2) });
    } catch (error) {
      console.error("Error getting daily count:", error);
      res.status(500).json({ message: "Failed to get daily count" });
    }
  });
  app2.post("/api/reset-daily-count", async (req, res) => {
    try {
      await storage.resetDailyCount();
      res.json({ message: "Daily count reset successfully" });
    } catch (error) {
      console.error("Error resetting daily count:", error);
      res.status(500).json({ message: "Failed to reset daily count" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname2 = path2.dirname(__filename);
var app = express2();
var server = createServer2(app);
var PORT = process.env.PORT || 5e3;
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
registerRoutes(app);
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app, server);
}
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
