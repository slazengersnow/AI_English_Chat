import { eq, desc, and, gte, lt, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  userSubscriptions,
  trainingSessions,
  userGoals,
  dailyProgress,
  customScenarios,
  type UserSubscription,
  type TrainingSession,
  type UserGoal,
  type DailyProgress,
  type CustomScenario,
  type InsertUserSubscription,
  type InsertTrainingSession,
  type InsertUserGoal,
  type InsertDailyProgress,
  type InsertCustomScenario,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Daily counter for rate limiting - simple in-memory store
const dailyCounters = new Map<string, { count: number; date: string }>();

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyCount(userId: string = "bizmowa.com"): number {
  const today = getTodayString();
  const counter = dailyCounters.get(userId);
  
  if (!counter || counter.date !== today) {
    // Reset counter for new day
    dailyCounters.set(userId, { count: 0, date: today });
    return 0;
  }
  
  return counter.count;
}

function incrementDailyCountInternal(userId: string = "bizmowa.com"): boolean {
  const today = getTodayString();
  const counter = dailyCounters.get(userId);
  
  if (!counter || counter.date !== today) {
    // First problem of the day
    dailyCounters.set(userId, { count: 1, date: today });
    return true;
  }
  
  if (counter.count >= 100) {
    // Daily limit reached
    return false;
  }
  
  // Increment counter
  counter.count++;
  dailyCounters.set(userId, counter);
  return true;
}

export interface IStorage {
  // User subscriptions
  getUserSubscription(userId?: string): Promise<UserSubscription | null>;
  updateUserSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  
  // Training sessions
  addTrainingSession(data: InsertTrainingSession): Promise<TrainingSession>;
  getUserAttemptedProblems(difficultyLevel: string, userId?: string): Promise<TrainingSession[]>;
  getCurrentProblemNumber(userId: string, difficultyLevel: string): Promise<number>;
  updateProblemProgress(userId: string, difficultyLevel: string, problemNumber: number): Promise<void>;
  
  // Daily limits - CRITICAL FUNCTIONS
  incrementDailyCount(userId?: string): Promise<boolean>;
  getDailyCount(userId?: string): Promise<number>;
  
  // Goals and progress
  getUserGoals(userId: string): Promise<UserGoal[]>;
  updateUserGoal(userId: string, data: Partial<InsertUserGoal>): Promise<UserGoal>;
  getDailyProgress(userId: string): Promise<DailyProgress[]>;
  updateDailyProgress(userId: string, data: Partial<InsertDailyProgress>): Promise<DailyProgress>;
  
  // Custom scenarios
  getCustomScenarios(userId: string): Promise<CustomScenario[]>;
  getCustomScenario(id: string): Promise<CustomScenario | null>;
  createCustomScenario(data: InsertCustomScenario): Promise<CustomScenario>;
  updateCustomScenario(id: string, data: Partial<InsertCustomScenario>): Promise<CustomScenario>;
  deleteCustomScenario(id: string): Promise<void>;
}

class Storage implements IStorage {
  // User subscriptions
  async getUserSubscription(userId: string = "bizmowa.com"): Promise<UserSubscription | null> {
    const result = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);
    
    return result[0] || null;
  }

  async updateUserSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const existingSubscription = await this.getUserSubscription(userId);
    
    if (existingSubscription) {
      const result = await db
        .update(userSubscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSubscriptions.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(userSubscriptions)
        .values({ ...data, userId })
        .returning();
      return result[0];
    }
  }

  // Training sessions
  async addTrainingSession(data: InsertTrainingSession): Promise<TrainingSession> {
    const result = await db
      .insert(trainingSessions)
      .values(data)
      .returning();
    return result[0];
  }

  async getUserAttemptedProblems(difficultyLevel: string, userId: string = "bizmowa.com"): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .where(and(
        eq(trainingSessions.userId, userId),
        eq(trainingSessions.difficultyLevel, difficultyLevel)
      ))
      .orderBy(desc(trainingSessions.createdAt));
  }

  async getCurrentProblemNumber(userId: string, difficultyLevel: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(trainingSessions)
      .where(and(
        eq(trainingSessions.userId, userId),
        eq(trainingSessions.difficultyLevel, difficultyLevel)
      ));
    
    return (result[0]?.count || 0) + 1;
  }

  async updateProblemProgress(userId: string, difficultyLevel: string, problemNumber: number): Promise<void> {
    // This is a placeholder for problem progress tracking
    // Implementation depends on specific requirements
  }

  // CRITICAL: Daily limit functions
  async incrementDailyCount(userId: string = "bizmowa.com"): Promise<boolean> {
    return incrementDailyCountInternal(userId);
  }

  async getDailyCount(userId: string = "bizmowa.com"): Promise<number> {
    return getDailyCount(userId);
  }

  // Goals and progress
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return await db
      .select()
      .from(userGoals)
      .orderBy(desc(userGoals.createdAt));
  }

  async updateUserGoal(userId: string, data: Partial<InsertUserGoal>): Promise<UserGoal> {
    const existingGoal = await db
      .select()
      .from(userGoals)
      .limit(1);

    if (existingGoal.length > 0) {
      const result = await db
        .update(userGoals)
        .set({ ...data, updatedAt: new Date() })
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(userGoals)
        .values(data)
        .returning();
      return result[0];
    }
  }

  async getDailyProgress(userId: string): Promise<DailyProgress[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db
      .select()
      .from(dailyProgress)
      .where(gte(dailyProgress.date, thirtyDaysAgo.toISOString().split('T')[0]))
      .orderBy(desc(dailyProgress.date));
  }

  async updateDailyProgress(userId: string, data: Partial<InsertDailyProgress>): Promise<DailyProgress> {
    const today = new Date().toISOString().split('T')[0];
    
    const existingProgress = await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.date, today))
      .limit(1);

    if (existingProgress.length > 0) {
      const result = await db
        .update(dailyProgress)
        .set(data)
        .where(eq(dailyProgress.date, today))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(dailyProgress)
        .values({ ...data, date: today })
        .returning();
      return result[0];
    }
  }

  // Custom scenarios
  async getCustomScenarios(userId: string): Promise<CustomScenario[]> {
    return await db
      .select()
      .from(customScenarios)
      .orderBy(desc(customScenarios.createdAt));
  }

  async getCustomScenario(id: string): Promise<CustomScenario | null> {
    const result = await db
      .select()
      .from(customScenarios)
      .where(eq(customScenarios.id, parseInt(id)))
      .limit(1);
    
    return result[0] || null;
  }

  async createCustomScenario(data: InsertCustomScenario): Promise<CustomScenario> {
    const result = await db
      .insert(customScenarios)
      .values(data)
      .returning();
    return result[0];
  }

  async updateCustomScenario(id: string, data: Partial<InsertCustomScenario>): Promise<CustomScenario> {
    const result = await db
      .update(customScenarios)
      .set(data)
      .where(eq(customScenarios.id, parseInt(id)))
      .returning();
    return result[0];
  }

  async deleteCustomScenario(id: string): Promise<void> {
    await db
      .delete(customScenarios)
      .where(eq(customScenarios.id, parseInt(id)));
  }
}

export const storage = new Storage();