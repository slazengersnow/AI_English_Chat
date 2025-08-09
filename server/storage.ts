import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc, and, gte } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import type {
  TrainingSession,
  InsertTrainingSession,
  UserGoal,
  InsertUserGoal,
  DailyProgress,
  InsertDailyProgress,
  CustomScenario,
  InsertCustomScenario,
} from "../shared/schema.js";

const { trainingSessions, userGoals, dailyProgress, customScenarios } = schema;

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// CRITICAL: Daily limit system - In-memory counter
const DAILY_LIMIT = 100;
const dailyCounters = new Map<string, { count: number; date: string }>();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
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
    // New day, reset counter
    dailyCounters.set(userId, { count: 1, date: today });
    console.log(`✅ Problem count: 1/${DAILY_LIMIT} for ${userId}`);
    return true;
  }

  if (counter.count >= DAILY_LIMIT) {
    console.log(`🛑 Daily limit (${DAILY_LIMIT}) reached - returning 429`);
    return false;
  }

  counter.count++;
  dailyCounters.set(userId, counter);
  console.log(
    `✅ Problem count: ${counter.count}/${DAILY_LIMIT} for ${userId}`,
  );
  return true;
}

function resetDailyCount(userId: string = "bizmowa.com"): void {
  console.log("🔄 Resetting daily count for user:", userId);
  dailyCounters.delete(userId);
}

export class Storage {
  // Daily count methods
  async incrementDailyCount(userId: string = "bizmowa.com"): Promise<boolean> {
    const currentCount = getDailyCount(userId);
    if (currentCount >= DAILY_LIMIT) {
      return false;
    }
    return incrementDailyCountInternal(userId);
  }
  // Training sessions
  async getTrainingSessions(userId: string): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.createdAt));
  }

  async getTrainingSession(id: string): Promise<TrainingSession | null> {
    const result = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, parseInt(id)))
      .limit(1);

    return result[0] || null;
  }

  async createTrainingSession(
    data: InsertTrainingSession,
  ): Promise<TrainingSession> {
    const result = await db.insert(trainingSessions).values(data).returning();
    return result[0];
  }

  async updateTrainingSession(
    id: string,
    data: Partial<InsertTrainingSession>,
  ): Promise<TrainingSession> {
    const result = await db
      .update(trainingSessions)
      .set(data)
      .where(eq(trainingSessions.id, parseInt(id)))
      .returning();
    return result[0];
  }

  async deleteTrainingSession(id: string): Promise<void> {
    await db
      .delete(trainingSessions)
      .where(eq(trainingSessions.id, parseInt(id)));
  }

  // Low-rated and review sessions
  async getLowRatedSessions(userId: string): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.createdAt))
      .limit(50);
  }

  async getBookmarkedSessions(userId: string): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.createdAt))
      .limit(50);
  }

  async updateReviewCount(sessionId: string): Promise<void> {
    // This is a placeholder for review count tracking
    // Implementation depends on specific requirements
  }

  async updateProblemProgress(userId: string, progress: any): Promise<void> {
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

  // Reset daily count for testing
  async resetDailyCount(userId: string = "bizmowa.com"): Promise<void> {
    resetDailyCount(userId);
  }

  // Goals and progress
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return await db.select().from(userGoals).orderBy(desc(userGoals.createdAt));
  }

  async updateUserGoal(
    userId: string,
    data: Partial<InsertUserGoal>,
  ): Promise<UserGoal> {
    const existingGoal = await db.select().from(userGoals).limit(1);

    if (existingGoal.length > 0) {
      const result = await db
        .update(userGoals)
        .set({ ...data, updatedAt: new Date() })
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userGoals).values(data).returning();
      return result[0];
    }
  }

  async getDailyProgress(userId: string): Promise<DailyProgress[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db
      .select()
      .from(dailyProgress)
      .where(gte(dailyProgress.date, thirtyDaysAgo.toISOString().split("T")[0]))
      .orderBy(desc(dailyProgress.date));
  }

  async updateDailyProgress(
    userId: string,
    data: Partial<InsertDailyProgress>,
  ): Promise<DailyProgress> {
    const today = new Date().toISOString().split("T")[0];

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

  async createCustomScenario(
    data: InsertCustomScenario,
  ): Promise<CustomScenario> {
    const result = await db.insert(customScenarios).values(data).returning();
    return result[0];
  }

  async updateCustomScenario(
    id: string,
    data: Partial<InsertCustomScenario>,
  ): Promise<CustomScenario> {
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
