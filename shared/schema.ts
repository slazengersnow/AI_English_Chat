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
  unique,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database Tables
// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Training sessions table
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 36 }).default("default_user").notNull(),
  difficultyLevel: text("difficulty_level").notNull(),
  japaneseSentence: text("japanese_sentence").notNull(),
  userTranslation: text("user_translation").notNull(),
  correctTranslation: text("correct_translation").notNull(),
  feedback: text("feedback").notNull(),
  rating: integer("rating").notNull(),
  isBookmarked: boolean("is_bookmarked").default(false).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  lastReviewed: timestamp("last_reviewed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User goals table
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  dailyGoal: integer("daily_goal").notNull().default(30),
  monthlyGoal: integer("monthly_goal").notNull().default(900),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User subscription table
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .default("default_user")
      .notNull(),
    subscriptionType: varchar("subscription_type")
      .default("standard")
      .notNull(), // "standard" or "premium"
    subscriptionStatus: varchar("subscription_status")
      .default("inactive")
      .notNull(), // active, trialing, canceled, past_due, etc.
    planName: varchar("plan_name"), // standard_monthly, premium_yearly, etc.
    stripeCustomerId: varchar("stripe_customer_id"),
    stripeSubscriptionId: varchar("stripe_subscription_id"),
    stripeSubscriptionItemId: varchar("stripe_subscription_item_id"), // For subscription upgrades
    validUntil: timestamp("valid_until"),
    trialStart: timestamp("trial_start"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserId: unique().on(table.userId),
  }),
);

// Daily progress table - Updated
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dailyCount: integer("daily_count").default(0).notNull(),
  problemsCompleted: integer("problems_completed").default(0).notNull(),
  averageRating: real("average_rating").default(0).notNull(),
});

// Custom scenarios table - Updated
export const customScenarios = pgTable("custom_scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Problem progress table - Updated
export const problemProgress = pgTable(
  "problem_progress",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    difficultyLevel: text("difficulty_level").notNull(),
    currentProblemNumber: integer("current_problem_number")
      .default(0)
      .notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isBookmarked: boolean("is_bookmarked").default(false).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
  },
  (table) => ({
    uniqueUserDifficulty: unique().on(table.userId, table.difficultyLevel),
  }),
);

// All tables defined above - schema complete

// Insert schemas - manual Zod schemas to match exact table structure
export const insertTrainingSessionSchema = z.object({
  userId: z.string().optional(),
  difficultyLevel: z.string(),
  japaneseSentence: z.string(),
  userTranslation: z.string(),
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number(),
  isBookmarked: z.boolean().optional(),
  reviewCount: z.number().optional(),
  lastReviewed: z.date().nullable().optional(),
});

export const insertUserGoalSchema = z.object({
  dailyGoal: z.number(),
  monthlyGoal: z.number(),
});

export const insertDailyProgressSchema = z.object({
  date: z.string(),
  dailyCount: z.number().optional(),
  problemsCompleted: z.number(),
  averageRating: z.number(),
});

export const insertCustomScenarioSchema = z.object({
  title: z.string(),
  description: z.string(),
  isActive: z.boolean().optional(),
});

export const insertUserSubscriptionSchema = z.object({
  userId: z.string().optional(),
  subscriptionType: z.string().optional(),
  subscriptionStatus: z.string().optional(),
  planName: z.string().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  stripeSubscriptionItemId: z.string().nullable().optional(),
  validUntil: z.date().nullable().optional(),
  trialStart: z.date().nullable().optional(),
  isAdmin: z.boolean().optional(),
});

export const insertProblemProgressSchema = z.object({
  userId: z.string(),
  difficultyLevel: z.string(),
  currentProblemNumber: z.number().optional(),
  isBookmarked: z.boolean().optional(),
  reviewCount: z.number().optional(),
});

// Type definitions
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type UserGoal = typeof userGoals.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type CustomScenario = typeof customScenarios.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type ProblemProgress = typeof problemProgress.$inferSelect;

export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertCustomScenario = z.infer<typeof insertCustomScenarioSchema>;
export type InsertUserSubscription = z.infer<
  typeof insertUserSubscriptionSchema
>;
export type InsertProblemProgress = z.infer<typeof insertProblemProgressSchema>;

// Zod Schemas - Date型に統一
export const trainingSessionSchema = z.object({
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
  createdAt: z.date(),
});

// API request/response schemas
export const translateRequestSchema = z.object({
  japaneseSentence: z.string().min(1),
  userTranslation: z.string().min(1),
  difficultyLevel: z.string(), // Allow simulation-X format as well as standard difficulty levels
});

export const translateResponseSchema = z.object({
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number().min(1).max(5),
  improvements: z.array(z.string()).optional(),
  explanation: z.string(),
  similarPhrases: z.array(z.string()),
  sessionId: z.number().optional(),
});

export const problemRequestSchema = z.object({
  difficultyLevel: z.enum([
    "toeic",
    "middle-school", 
    "high-school",
    "basic-verbs",
    "business-email",
    "simulation",
  ]),
});

export const problemResponseSchema = z.object({
  japaneseSentence: z.string(),
  hints: z.array(z.string()).optional(),
});

// Stripe payment schemas
export const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export const checkoutSessionResponseSchema = z.object({
  url: z.string(),
  sessionId: z.string(),
});

// Difficulty level metadata
export const DIFFICULTY_LEVELS = {
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
  simulation: {
    name: "シミュレーション練習",
    description: "実際の場面を想定した英会話",
    color: "orange",
    icon: "users",
  },
} as const;

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type Conversation = {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
};

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;

// Export types
export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type TranslateResponse = z.infer<typeof translateResponseSchema>;
export type ProblemRequest = z.infer<typeof problemRequestSchema>;
export type ProblemResponse = z.infer<typeof problemResponseSchema>;
export type CreateCheckoutSessionRequest = z.infer<
  typeof createCheckoutSessionSchema
>;
export type CheckoutSessionResponse = z.infer<
  typeof checkoutSessionResponseSchema
>;
