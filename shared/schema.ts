import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar, date, index, unique } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().default("default_user"),
  subscriptionType: varchar("subscription_type").notNull().default("standard"), // "standard" or "premium"
  subscriptionStatus: varchar("subscription_status").notNull().default("inactive"), // active, trialing, canceled, past_due, etc.
  planName: varchar("plan_name"), // standard_monthly, premium_yearly, etc.
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeSubscriptionItemId: varchar("stripe_subscription_item_id"), // For subscription upgrades
  validUntil: timestamp("valid_until"),
  trialStart: timestamp("trial_start"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

// Daily progress table
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  problemsCompleted: integer("problems_completed").notNull().default(0),
  averageRating: integer("average_rating").notNull().default(0),
  dailyCount: integer("daily_count").notNull().default(0), // Track problems attempted today
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Custom scenarios table
export const customScenarios = pgTable("custom_scenarios", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Problem progress table - tracks current problem number for each difficulty
export const problemProgress = pgTable("problem_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().default("default_user"),
  difficultyLevel: varchar("difficulty_level").notNull(),
  currentProblemNumber: integer("current_problem_number").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserDifficulty: unique().on(table.userId, table.difficultyLevel),
}));

// Insert schemas
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({ id: true, createdAt: true });
export const insertUserGoalSchema = createInsertSchema(userGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({ id: true, createdAt: true });
export const insertCustomScenarioSchema = createInsertSchema(customScenarios).omit({ id: true, createdAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProblemProgressSchema = createInsertSchema(problemProgress).omit({ id: true, updatedAt: true });

// Zod Schemas  
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
  lastReviewed: z.string().optional(),
  createdAt: z.string(),
});

export const userGoalSchema = z.object({
  id: z.number(),
  dailyGoal: z.number(),
  monthlyGoal: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const dailyProgressSchema = z.object({
  id: z.number(),
  date: z.string(),
  problemsCompleted: z.number(),
  averageRating: z.number(),
  dailyCount: z.number(),
  createdAt: z.string(),
});

export const customScenarioSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const userSubscriptionSchema = z.object({
  id: z.number(),
  userId: z.string(),
  subscriptionType: z.enum(["standard", "premium"]),
  subscriptionStatus: z.string().optional(),
  planName: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  validUntil: z.date().optional(),
  isAdmin: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const problemProgressSchema = z.object({
  id: z.number(),
  userId: z.string(),
  difficultyLevel: z.string(),
  currentProblemNumber: z.number(),
  updatedAt: z.date(),
});

// Types
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type UserGoal = z.infer<typeof userGoalSchema>;
export type DailyProgress = z.infer<typeof dailyProgressSchema>;
export type CustomScenario = z.infer<typeof customScenarioSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type ProblemProgress = z.infer<typeof problemProgressSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertCustomScenario = z.infer<typeof insertCustomScenarioSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertProblemProgress = z.infer<typeof insertProblemProgressSchema>;

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
  difficultyLevel: z.enum(['toeic', 'middle-school', 'high-school', 'basic-verbs', 'business-email']),
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
  'toeic': {
    name: 'TOEIC',
    description: 'ビジネス英語・資格対策',
    color: 'purple',
    icon: 'briefcase',
  },
  'middle-school': {
    name: '中学英語',
    description: '基本的な文法と語彙',
    color: 'blue',
    icon: 'book-open',
  },
  'high-school': {
    name: '高校英語',
    description: '応用文法と表現',
    color: 'green',
    icon: 'graduation-cap',
  },
  'basic-verbs': {
    name: '基本動詞',
    description: '日常動詞の使い分け',
    color: 'orange',
    icon: 'zap',
  },
  'business-email': {
    name: 'ビジネスメール',
    description: '実務メール作成',
    color: 'red',
    icon: 'mail',
  },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;

// Export types
export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type TranslateResponse = z.infer<typeof translateResponseSchema>;
export type ProblemRequest = z.infer<typeof problemRequestSchema>;
export type ProblemResponse = z.infer<typeof problemResponseSchema>;
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionSchema>;
export type CheckoutSessionResponse = z.infer<typeof checkoutSessionResponseSchema>;