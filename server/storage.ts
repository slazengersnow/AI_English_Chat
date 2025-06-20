import {
  trainingSessions,
  userGoals,
  dailyProgress,
  customScenarios,
  type TrainingSession,
  type UserGoal,
  type DailyProgress,
  type CustomScenario,
  type InsertTrainingSession,
  type InsertUserGoal,
  type InsertDailyProgress,
  type InsertCustomScenario,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // Training sessions
  addTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  getTrainingSessions(): Promise<TrainingSession[]>;
  getSessionsByDifficulty(difficultyLevel: string): Promise<TrainingSession[]>;
  updateBookmark(sessionId: number, isBookmarked: boolean): Promise<void>;
  getSessionsForReview(ratingThreshold: number): Promise<TrainingSession[]>;
  getBookmarkedSessions(): Promise<TrainingSession[]>;
  updateReviewCount(sessionId: number): Promise<void>;
  
  // User goals
  getUserGoals(): Promise<UserGoal | undefined>;
  updateUserGoals(goals: InsertUserGoal): Promise<UserGoal>;
  
  // Daily progress
  getDailyProgress(date: string): Promise<DailyProgress | undefined>;
  updateDailyProgress(date: string, problemsCompleted: number, averageRating: number): Promise<DailyProgress>;
  getProgressHistory(startDate: string, endDate: string): Promise<DailyProgress[]>;
  getStreakCount(): Promise<number>;
  
  // Custom scenarios
  getCustomScenarios(): Promise<CustomScenario[]>;
  addCustomScenario(scenario: InsertCustomScenario): Promise<CustomScenario>;
  updateCustomScenario(id: number, scenario: Partial<InsertCustomScenario>): Promise<CustomScenario>;
  deleteCustomScenario(id: number): Promise<void>;
  
  // Analytics
  getDifficultyStats(): Promise<Array<{ difficulty: string; count: number; averageRating: number }>>;
  getMonthlyStats(year: number, month: number): Promise<{ totalProblems: number; averageRating: number }>;
}

export class DatabaseStorage implements IStorage {
  // Training sessions
  async addTrainingSession(sessionData: InsertTrainingSession): Promise<TrainingSession> {
    const [session] = await db
      .insert(trainingSessions)
      .values({
        ...sessionData,
        createdAt: new Date(),
      })
      .returning();
    
    // Update daily progress
    const today = new Date().toISOString().split('T')[0];
    await this.updateDailyProgressForDate(today);
    
    return {
      ...session,
      difficultyLevel: session.difficultyLevel as any,
      createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
      lastReviewed: session.lastReviewed?.toISOString(),
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0,
    };
  }

  async getTrainingSessions(): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.createdAt));
    
    return sessions.map(session => ({
      ...session,
      createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
      lastReviewed: session.lastReviewed?.toISOString(),
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0,
    }));
  }

  async getSessionsByDifficulty(difficultyLevel: string): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.difficultyLevel, difficultyLevel))
      .orderBy(desc(trainingSessions.createdAt));
    
    return sessions.map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastReviewed: session.lastReviewed?.toISOString(),
    }));
  }

  async updateBookmark(sessionId: number, isBookmarked: boolean): Promise<void> {
    await db
      .update(trainingSessions)
      .set({ isBookmarked })
      .where(eq(trainingSessions.id, sessionId));
  }

  async getSessionsForReview(ratingThreshold: number): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(lte(trainingSessions.rating, ratingThreshold))
      .orderBy(desc(trainingSessions.createdAt));
    
    return sessions.map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastReviewed: session.lastReviewed?.toISOString(),
    }));
  }

  async getBookmarkedSessions(): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.isBookmarked, true))
      .orderBy(desc(trainingSessions.createdAt));
    
    return sessions.map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastReviewed: session.lastReviewed?.toISOString(),
    }));
  }

  async updateReviewCount(sessionId: number): Promise<void> {
    await db
      .update(trainingSessions)
      .set({ 
        reviewCount: sql`${trainingSessions.reviewCount} + 1`,
        lastReviewed: new Date()
      })
      .where(eq(trainingSessions.id, sessionId));
  }

  // User goals
  async getUserGoals(): Promise<UserGoal | undefined> {
    const [goal] = await db
      .select()
      .from(userGoals)
      .orderBy(desc(userGoals.createdAt))
      .limit(1);
    
    if (!goal) return undefined;
    
    return {
      ...goal,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  async updateUserGoals(goalData: InsertUserGoal): Promise<UserGoal> {
    const [goal] = await db
      .insert(userGoals)
      .values({
        ...goalData,
        updatedAt: new Date(),
      })
      .returning();
    
    return {
      ...goal,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  // Daily progress
  async getDailyProgress(date: string): Promise<DailyProgress | undefined> {
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.date, date));
    
    if (!progress) return undefined;
    
    return {
      ...progress,
      createdAt: progress.createdAt.toISOString(),
    };
  }

  async updateDailyProgress(date: string, problemsCompleted: number, averageRating: number): Promise<DailyProgress> {
    const [progress] = await db
      .insert(dailyProgress)
      .values({
        date,
        problemsCompleted,
        averageRating,
      })
      .onConflictDoUpdate({
        target: dailyProgress.date,
        set: {
          problemsCompleted,
          averageRating,
        },
      })
      .returning();
    
    return {
      ...progress,
      createdAt: progress.createdAt.toISOString(),
    };
  }

  private async updateDailyProgressForDate(date: string): Promise<void> {
    const todaySessions = await db
      .select()
      .from(trainingSessions)
      .where(
        and(
          gte(trainingSessions.createdAt, new Date(date + 'T00:00:00Z')),
          lte(trainingSessions.createdAt, new Date(date + 'T23:59:59Z'))
        )
      );

    if (todaySessions.length > 0) {
      const averageRating = Math.round(
        todaySessions.reduce((sum, session) => sum + session.rating, 0) / todaySessions.length
      );
      
      await this.updateDailyProgress(date, todaySessions.length, averageRating);
    }
  }

  async getProgressHistory(startDate: string, endDate: string): Promise<DailyProgress[]> {
    const progress = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          gte(dailyProgress.date, startDate),
          lte(dailyProgress.date, endDate)
        )
      )
      .orderBy(dailyProgress.date);
    
    return progress.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getStreakCount(): Promise<number> {
    const recent = await db
      .select({ date: dailyProgress.date })
      .from(dailyProgress)
      .where(gte(dailyProgress.problemsCompleted, 1))
      .orderBy(desc(dailyProgress.date))
      .limit(365);
    
    let streak = 0;
    const today = new Date();
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

  // Custom scenarios
  async getCustomScenarios(): Promise<CustomScenario[]> {
    const scenarios = await db
      .select()
      .from(customScenarios)
      .where(eq(customScenarios.isActive, true))
      .orderBy(desc(customScenarios.createdAt));
    
    return scenarios.map(scenario => ({
      ...scenario,
      createdAt: scenario.createdAt.toISOString(),
    }));
  }

  async addCustomScenario(scenarioData: InsertCustomScenario): Promise<CustomScenario> {
    const [scenario] = await db
      .insert(customScenarios)
      .values(scenarioData)
      .returning();
    
    return {
      ...scenario,
      createdAt: scenario.createdAt.toISOString(),
    };
  }

  async updateCustomScenario(id: number, scenarioData: Partial<InsertCustomScenario>): Promise<CustomScenario> {
    const [scenario] = await db
      .update(customScenarios)
      .set(scenarioData)
      .where(eq(customScenarios.id, id))
      .returning();
    
    return {
      ...scenario,
      createdAt: scenario.createdAt.toISOString(),
    };
  }

  async deleteCustomScenario(id: number): Promise<void> {
    await db
      .update(customScenarios)
      .set({ isActive: false })
      .where(eq(customScenarios.id, id));
  }

  // Analytics
  async getDifficultyStats(): Promise<Array<{ difficulty: string; count: number; averageRating: number }>> {
    const stats = await db
      .select({
        difficulty: trainingSessions.difficultyLevel,
        count: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
      })
      .from(trainingSessions)
      .groupBy(trainingSessions.difficultyLevel);
    
    return stats.map(stat => ({
      difficulty: stat.difficulty,
      count: Number(stat.count),
      averageRating: Number(stat.averageRating),
    }));
  }

  async getMonthlyStats(year: number, month: number): Promise<{ totalProblems: number; averageRating: number }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const [stats] = await db
      .select({
        totalProblems: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
      })
      .from(trainingSessions)
      .where(
        and(
          gte(trainingSessions.createdAt, new Date(startDate)),
          lte(trainingSessions.createdAt, new Date(endDate))
        )
      );
    
    return {
      totalProblems: Number(stats?.totalProblems || 0),
      averageRating: Number(stats?.averageRating || 0),
    };
  }
}

export const storage = new DatabaseStorage();