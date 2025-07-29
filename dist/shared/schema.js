"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIFFICULTY_LEVELS = exports.checkoutSessionResponseSchema = exports.createCheckoutSessionSchema = exports.problemResponseSchema = exports.problemRequestSchema = exports.translateResponseSchema = exports.translateRequestSchema = exports.trainingSessionSchema = exports.insertProblemProgressSchema = exports.insertUserSubscriptionSchema = exports.insertCustomScenarioSchema = exports.insertDailyProgressSchema = exports.insertUserGoalSchema = exports.insertTrainingSessionSchema = exports.problemProgress = exports.customScenarios = exports.dailyProgress = exports.userSubscriptions = exports.userGoals = exports.trainingSessions = exports.sessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const zod_1 = require("zod");
// Database Tables
// Session storage table (mandatory for Replit Auth)
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => [(0, pg_core_1.index)("IDX_session_expire").on(table.expire)]);
// Training sessions table
exports.trainingSessions = (0, pg_core_1.pgTable)("training_sessions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 36 }).default("default_user").notNull(),
    difficultyLevel: (0, pg_core_1.text)("difficulty_level").notNull(),
    japaneseSentence: (0, pg_core_1.text)("japanese_sentence").notNull(),
    userTranslation: (0, pg_core_1.text)("user_translation").notNull(),
    correctTranslation: (0, pg_core_1.text)("correct_translation").notNull(),
    feedback: (0, pg_core_1.text)("feedback").notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    isBookmarked: (0, pg_core_1.boolean)("is_bookmarked").default(false).notNull(),
    reviewCount: (0, pg_core_1.integer)("review_count").default(0).notNull(),
    lastReviewed: (0, pg_core_1.timestamp)("last_reviewed"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// User goals table
exports.userGoals = (0, pg_core_1.pgTable)("user_goals", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    dailyGoal: (0, pg_core_1.integer)("daily_goal").notNull().default(30),
    monthlyGoal: (0, pg_core_1.integer)("monthly_goal").notNull().default(900),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
// User subscription table
exports.userSubscriptions = (0, pg_core_1.pgTable)("user_subscriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 36 })
        .default("default_user")
        .notNull(),
    subscriptionType: (0, pg_core_1.varchar)("subscription_type")
        .default("standard")
        .notNull(), // "standard" or "premium"
    subscriptionStatus: (0, pg_core_1.varchar)("subscription_status")
        .default("inactive")
        .notNull(), // active, trialing, canceled, past_due, etc.
    planName: (0, pg_core_1.varchar)("plan_name"), // standard_monthly, premium_yearly, etc.
    stripeCustomerId: (0, pg_core_1.varchar)("stripe_customer_id"),
    stripeSubscriptionId: (0, pg_core_1.varchar)("stripe_subscription_id"),
    stripeSubscriptionItemId: (0, pg_core_1.varchar)("stripe_subscription_item_id"), // For subscription upgrades
    validUntil: (0, pg_core_1.timestamp)("valid_until"),
    trialStart: (0, pg_core_1.timestamp)("trial_start"),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => ({
    uniqueUserId: (0, pg_core_1.unique)().on(table.userId),
}));
// Daily progress table - Updated
exports.dailyProgress = (0, pg_core_1.pgTable)("daily_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    dailyCount: (0, pg_core_1.integer)("daily_count").default(0).notNull(),
    problemsCompleted: (0, pg_core_1.integer)("problems_completed").default(0).notNull(),
    averageRating: (0, pg_core_1.real)("average_rating").default(0).notNull(),
});
// Custom scenarios table - Updated
exports.customScenarios = (0, pg_core_1.pgTable)("custom_scenarios", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Problem progress table - Updated
exports.problemProgress = (0, pg_core_1.pgTable)("problem_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.varchar)("user_id", { length: 36 }).notNull(),
    difficultyLevel: (0, pg_core_1.text)("difficulty_level").notNull(),
    currentProblemNumber: (0, pg_core_1.integer)("current_problem_number")
        .default(0)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    isBookmarked: (0, pg_core_1.boolean)("is_bookmarked").default(false).notNull(),
    reviewCount: (0, pg_core_1.integer)("review_count").default(0).notNull(),
}, (table) => ({
    uniqueUserDifficulty: (0, pg_core_1.unique)().on(table.userId, table.difficultyLevel),
}));
// All tables defined above - schema complete
// Insert schemas - manual Zod schemas to match exact table structure
exports.insertTrainingSessionSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    difficultyLevel: zod_1.z.string(),
    japaneseSentence: zod_1.z.string(),
    userTranslation: zod_1.z.string(),
    correctTranslation: zod_1.z.string(),
    feedback: zod_1.z.string(),
    rating: zod_1.z.number(),
    isBookmarked: zod_1.z.boolean().optional(),
    reviewCount: zod_1.z.number().optional(),
    lastReviewed: zod_1.z.date().nullable().optional(),
});
exports.insertUserGoalSchema = zod_1.z.object({
    dailyGoal: zod_1.z.number(),
    monthlyGoal: zod_1.z.number(),
});
exports.insertDailyProgressSchema = zod_1.z.object({
    date: zod_1.z.string(),
    dailyCount: zod_1.z.number().optional(),
    problemsCompleted: zod_1.z.number(),
    averageRating: zod_1.z.number(),
});
exports.insertCustomScenarioSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    isActive: zod_1.z.boolean().optional(),
});
exports.insertUserSubscriptionSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    subscriptionType: zod_1.z.string().optional(),
    subscriptionStatus: zod_1.z.string().optional(),
    planName: zod_1.z.string().nullable().optional(),
    stripeCustomerId: zod_1.z.string().nullable().optional(),
    stripeSubscriptionId: zod_1.z.string().nullable().optional(),
    stripeSubscriptionItemId: zod_1.z.string().nullable().optional(),
    validUntil: zod_1.z.date().nullable().optional(),
    trialStart: zod_1.z.date().nullable().optional(),
    isAdmin: zod_1.z.boolean().optional(),
});
exports.insertProblemProgressSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    difficultyLevel: zod_1.z.string(),
    currentProblemNumber: zod_1.z.number().optional(),
    isBookmarked: zod_1.z.boolean().optional(),
    reviewCount: zod_1.z.number().optional(),
});
// Zod Schemas - Date型に統一
exports.trainingSessionSchema = zod_1.z.object({
    id: zod_1.z.number(),
    difficultyLevel: zod_1.z.string(),
    japaneseSentence: zod_1.z.string(),
    userTranslation: zod_1.z.string(),
    correctTranslation: zod_1.z.string(),
    feedback: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(5),
    isBookmarked: zod_1.z.boolean().optional(),
    reviewCount: zod_1.z.number().optional(),
    lastReviewed: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
});
// API request/response schemas
exports.translateRequestSchema = zod_1.z.object({
    japaneseSentence: zod_1.z.string().min(1),
    userTranslation: zod_1.z.string().min(1),
    difficultyLevel: zod_1.z.string(), // Allow simulation-X format as well as standard difficulty levels
});
exports.translateResponseSchema = zod_1.z.object({
    correctTranslation: zod_1.z.string(),
    feedback: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(5),
    improvements: zod_1.z.array(zod_1.z.string()).optional(),
    explanation: zod_1.z.string(),
    similarPhrases: zod_1.z.array(zod_1.z.string()),
    sessionId: zod_1.z.number().optional(),
});
exports.problemRequestSchema = zod_1.z.object({
    difficultyLevel: zod_1.z.enum([
        "toeic",
        "middle-school",
        "high-school",
        "basic-verbs",
        "business-email",
    ]),
});
exports.problemResponseSchema = zod_1.z.object({
    japaneseSentence: zod_1.z.string(),
    hints: zod_1.z.array(zod_1.z.string()).optional(),
});
// Stripe payment schemas
exports.createCheckoutSessionSchema = zod_1.z.object({
    priceId: zod_1.z.string(),
    successUrl: zod_1.z.string().optional(),
    cancelUrl: zod_1.z.string().optional(),
});
exports.checkoutSessionResponseSchema = zod_1.z.object({
    url: zod_1.z.string(),
    sessionId: zod_1.z.string(),
});
// Difficulty level metadata
exports.DIFFICULTY_LEVELS = {
    toeic: {
        name: "TOEIC",
        description: "ビジネス英語・資格対策",
        color: "purple",
        icon: "briefcase",
    },
    "middle-school": {
        name: "中学英語",
        description: "基本的な文法と語彙",
        color: "blue",
        icon: "book-open",
    },
    "high-school": {
        name: "高校英語",
        description: "応用文法と表現",
        color: "green",
        icon: "graduation-cap",
    },
    "basic-verbs": {
        name: "基本動詞",
        description: "日常動詞の使い分け",
        color: "orange",
        icon: "zap",
    },
    "business-email": {
        name: "ビジネスメール",
        description: "実務メール作成",
        color: "red",
        icon: "mail",
    },
};
