import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Training session types
export const trainingSessionSchema = z.object({
  id: z.number(),
  difficultyLevel: z.enum(['toeic', 'middle-school', 'high-school', 'basic-verbs', 'business-email']),
  japaneseSentence: z.string(),
  userTranslation: z.string(),
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number().min(1).max(5),
  createdAt: z.string(),
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;

// API request/response schemas
export const translateRequestSchema = z.object({
  japaneseSentence: z.string().min(1),
  userTranslation: z.string().min(1),
  difficultyLevel: z.enum(['toeic', 'middle-school', 'high-school', 'basic-verbs', 'business-email']),
});

export const translateResponseSchema = z.object({
  correctTranslation: z.string(),
  feedback: z.string(),
  rating: z.number().min(1).max(5),
  improvements: z.array(z.string()).optional(),
  explanation: z.string(),
  similarPhrases: z.array(z.string()),
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