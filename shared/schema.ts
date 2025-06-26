import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar, date, index } from "drizzle-orm/pg-core";
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
  difficultyLevel: varchar("difficulty_level").notNull(),
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
  dailyGoal: integer("daily_goal").default(30).notNull(),
  monthlyGoal: integer("monthly_goal").default(900).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User subscription table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").default("default_user").notNull(),
  subscriptionType: varchar("subscription_type").default("standard").notNull(), // "standard" or "premium"
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily progress table
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  problemsCompleted: integer("problems_completed").default(0).notNull(),
  averageRating: integer("average_rating").default(0).notNull(),
  dailyCount: integer("daily_count").default(0).notNull(), // Track problems attempted today
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom scenarios table
export const customScenarios = pgTable("custom_scenarios", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({ id: true, createdAt: true });
export const insertUserGoalSchema = createInsertSchema(userGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({ id: true, createdAt: true });
export const insertCustomScenarioSchema = createInsertSchema(customScenarios).omit({ id: true, createdAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });

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
  isAdmin: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type UserGoal = z.infer<typeof userGoalSchema>;
export type DailyProgress = z.infer<typeof dailyProgressSchema>;
export type CustomScenario = z.infer<typeof customScenarioSchema>;
export type UserSubscription = z.infer<typeof userSubscriptionSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertCustomScenario = z.infer<typeof insertCustomScenarioSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

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