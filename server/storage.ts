import {
  trainingSessions,
  userGoals,
  dailyProgress,
  customScenarios,
  userSubscriptions,
  problemProgress,
  type TrainingSession,
  type UserGoal,
  type DailyProgress,
  type CustomScenario,
  type UserSubscription,
  type ProblemProgress,
  type InsertTrainingSession,
  type InsertUserGoal,
  type InsertDailyProgress,
  type InsertCustomScenario,
  type InsertUserSubscription,
  type InsertProblemProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

// Schema imports only - all table definitions are in shared/schema.ts

export interface IStorage {
  // Training sessions
  addTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  getTrainingSessions(): Promise<TrainingSession[]>;
  getSessionsByDifficulty(difficultyLevel: string): Promise<TrainingSession[]>;
  updateBookmark(sessionId: number, isBookmarked: boolean): Promise<void>;
  getSessionsForReview(ratingThreshold: number): Promise<TrainingSession[]>;
  getBookmarkedSessions(): Promise<TrainingSession[]>;
  updateReviewCount(sessionId: number): Promise<void>;
  getRecentSessions(daysBack: number): Promise<TrainingSession[]>;

  // User goals
  getUserGoals(): Promise<UserGoal | undefined>;
  updateUserGoals(goals: InsertUserGoal): Promise<UserGoal>;

  // Daily progress
  getDailyProgress(date: string): Promise<DailyProgress | undefined>;
  updateDailyProgress(
    date: string,
    problemsCompleted: number,
    averageRating: number,
  ): Promise<DailyProgress>;
  getProgressHistory(
    startDate: string,
    endDate: string,
  ): Promise<DailyProgress[]>;
  getStreakCount(): Promise<number>;

  // Daily limit functionality
  getTodaysProblemCount(): Promise<number>;
  incrementDailyCount(): Promise<boolean>; // Returns false if limit reached
  resetDailyCount(date?: string): Promise<void>;

  // Custom scenarios
  getCustomScenarios(): Promise<CustomScenario[]>;
  getCustomScenario(id: number): Promise<CustomScenario | undefined>;
  addCustomScenario(scenario: InsertCustomScenario): Promise<CustomScenario>;
  updateCustomScenario(
    id: number,
    scenario: Partial<InsertCustomScenario>,
  ): Promise<CustomScenario>;
  deleteCustomScenario(id: number): Promise<void>;

  // Analytics
  getDifficultyStats(): Promise<
    Array<{ difficulty: string; count: number; averageRating: number }>
  >;
  getMonthlyStats(
    year: number,
    month: number,
  ): Promise<{ totalProblems: number; averageRating: number }>;

  // Problem tracking
  getUserAttemptedProblems(
    difficultyLevel: string,
  ): Promise<Array<{ japaneseSentence: string }>>;

  // Problem progress tracking
  getCurrentProblemNumber(
    userId: string,
    difficultyLevel: string,
  ): Promise<number>;
  updateProblemProgress(
    userId: string,
    difficultyLevel: string,
    problemNumber: number,
  ): Promise<void>;

  // User subscription
  getUserSubscription(userId?: string): Promise<UserSubscription | undefined>;
  updateUserSubscription(
    userId: string,
    subscription: Partial<InsertUserSubscription>,
  ): Promise<UserSubscription>;

  // Admin functions
  getAdminStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    activeSubscriptions: number;
    monthlyActiveUsers: number;
  }>;
  getAllUsers(): Promise<
    Array<{
      id: string;
      email: string;
      subscriptionType: string;
      isAdmin: boolean;
      createdAt: string;
      lastActive: string;
    }>
  >;
  getLearningAnalytics(): Promise<{
    totalLearningTime: number;
    totalLearningCount: number;
    categoryStats: Array<{
      category: string;
      correctRate: number;
      totalAttempts: number;
    }>;
    monthlyStats: Array<{
      month: string;
      sessions: number;
      averageRating: number;
    }>;
  }>;
  exportData(type: string): Promise<string>;

  // User data management
  resetUserData(userId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Training sessions
  async addTrainingSession(
    sessionData: InsertTrainingSession,
  ): Promise<TrainingSession> {
    const [session] = await db
      .insert(trainingSessions)
      .values({
        difficultyLevel: sessionData.difficultyLevel,
        japaneseSentence: sessionData.japaneseSentence,
        userTranslation: sessionData.userTranslation,
        correctTranslation: sessionData.correctTranslation,
        feedback: sessionData.feedback,
        rating: sessionData.rating,
      })
      .returning();

    // Update daily progress
    const today = new Date().toISOString().split("T")[0];
    await this.updateDailyProgressForDate(today);

    return {
      ...session,
      difficultyLevel: session.difficultyLevel as any,
      createdAt: session.createdAt ?? new Date(),
      lastReviewed: session.lastReviewed ?? null,
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0,
    };
  }

  async getTrainingSessions(): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .orderBy(desc(trainingSessions.createdAt));

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt ?? new Date(),
      lastReviewed: session.lastReviewed ?? null,
      isBookmarked: session.isBookmarked || false,
      reviewCount: session.reviewCount || 0,
    }));
  }

  async getSessionsByDifficulty(
    difficultyLevel: string,
  ): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.difficultyLevel, difficultyLevel))
      .orderBy(desc(trainingSessions.createdAt));

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? null,
    }));
  }

  async updateBookmark(
    sessionId: number,
    isBookmarked: boolean,
  ): Promise<void> {
    await db
      .update(trainingSessions)
      .set({ rating: 0 })
      .where(eq(trainingSessions.id, sessionId));
  }

  async getSessionsForReview(
    ratingThreshold: number,
  ): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(lte(trainingSessions.rating, ratingThreshold))
      .orderBy(desc(trainingSessions.createdAt));

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? null,
    }));
  }

  async getBookmarkedSessions(): Promise<TrainingSession[]> {
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.isBookmarked, true))
      .orderBy(desc(trainingSessions.createdAt));

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? null,
    }));
  }

  async updateReviewCount(sessionId: number): Promise<void> {
    await db
      .update(trainingSessions)
      .set({
        rating: sql`${trainingSessions.rating} + 1`,
      })
      .where(eq(trainingSessions.id, sessionId));
  }

  async getRecentSessions(daysBack: number = 7): Promise<TrainingSession[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(gte(trainingSessions.createdAt, cutoffDate))
      .orderBy(desc(trainingSessions.createdAt))
      .limit(50); // Limit to prevent too many results

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt,
      lastReviewed: session.lastReviewed ?? null,
    }));
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
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }

  async updateUserGoals(goalData: InsertUserGoal): Promise<UserGoal> {
    const [goal] = await db
      .insert(userGoals)
      .values({
        dailyGoal: goalData.dailyGoal,
        monthlyGoal: goalData.monthlyGoal,
      })
      .returning();

    return {
      ...goal,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
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
      createdAt: progress.createdAt,
      dailyCount: progress.dailyCount,
    };
  }

  async updateDailyProgress(
    date: string,
    problemsCompleted: number,
    averageRating: number,
  ): Promise<DailyProgress> {
    const [progress] = await db
      .insert(dailyProgress)
      .values({
        date,
      })
      .onConflictDoUpdate({
        target: dailyProgress.date,
        set: {
          date,
        },
      })
      .returning();

    return {
      ...progress,
      createdAt: progress.createdAt,
      dailyCount: progress.dailyCount,
    };
  }

  private async updateDailyProgressForDate(date: string): Promise<void> {
    const todaySessions = await db
      .select()
      .from(trainingSessions)
      .where(
        and(
          gte(trainingSessions.createdAt, new Date(date + "T00:00:00Z")),
          lte(trainingSessions.createdAt, new Date(date + "T23:59:59Z")),
        ),
      );

    if (todaySessions.length > 0) {
      const averageRating = Math.round(
        todaySessions.reduce((sum, session) => sum + session.rating, 0) /
          todaySessions.length,
      );

      await this.updateDailyProgress(date, todaySessions.length, averageRating);
    }
  }

  async getProgressHistory(
    startDate: string,
    endDate: string,
  ): Promise<DailyProgress[]> {
    const progress = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          gte(dailyProgress.date, startDate),
          lte(dailyProgress.date, endDate),
        ),
      )
      .orderBy(dailyProgress.date);

    return progress.map((p) => ({
      ...p,
      createdAt: p.createdAt,
      dailyCount: p.dailyCount,
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

  // Daily limit functionality
  async getTodaysProblemCount(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const progress = await this.getDailyProgress(today);
    return progress?.dailyCount || 0;
  }

  async incrementDailyCount(): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const currentCount = await this.getTodaysProblemCount();

    // Check if limit reached
    if (currentCount >= 100) {
      return false;
    }

    // Increment count
    await db
      .insert(dailyProgress)
      .values({
        date: today,
        dailyCount: 1,
        problemsCompleted: 0,
        averageRating: 0,
      })
      .onConflictDoUpdate({
        target: dailyProgress.date,
        set: {
          dailyCount: sql`${dailyProgress.dailyCount} + 1`,
        },
      });

    return true;
  }

  async resetDailyCount(date?: string): Promise<void> {
    const targetDate = date || new Date().toISOString().split("T")[0];

    await db
      .insert(dailyProgress)
      .values({
        date: targetDate,
      })
      .onConflictDoUpdate({
        target: dailyProgress.date,
        set: {
          date: targetDate,
        },
      });
  }

  // Custom scenarios
  async getCustomScenarios(): Promise<CustomScenario[]> {
    const scenarios = await db
      .select()
      .from(customScenarios)
      .where(eq(customScenarios.isActive, true))
      .orderBy(desc(customScenarios.createdAt));

    return scenarios.map((scenario) => ({
      ...scenario,
      createdAt: scenario.createdAt ?? new Date(),
      isActive: scenario.isActive,
    }));
  }

  async getCustomScenario(id: number): Promise<CustomScenario | undefined> {
    const [scenario] = await db
      .select()
      .from(customScenarios)
      .where(
        and(eq(customScenarios.id, id), eq(customScenarios.isActive, true)),
      );

    if (!scenario) return undefined;

    return {
      ...scenario,
      createdAt: scenario.createdAt ?? new Date(),
      isActive: scenario.isActive || true,
    };
  }

  async addCustomScenario(
    scenarioData: InsertCustomScenario,
  ): Promise<CustomScenario> {
    const [scenario] = await db
      .insert(customScenarios)
      .values({
        title: scenarioData.title,
        description: scenarioData.description,
      })
      .returning();

    return scenario;
  }

  async updateCustomScenario(
    id: number,
    scenarioData: Partial<InsertCustomScenario>,
  ): Promise<CustomScenario> {
    const updateData: any = {};
    if (scenarioData.title !== undefined) updateData.title = scenarioData.title;
    if (scenarioData.description !== undefined)
      updateData.description = scenarioData.description;
    if (scenarioData.isActive !== undefined)
      updateData.isActive = scenarioData.isActive;

    const [scenario] = await db
      .update(customScenarios)
      .set(updateData)
      .where(eq(customScenarios.id, id))
      .returning();

    return scenario;
  }

  async deleteCustomScenario(id: number): Promise<void> {
    await db
      .update(customScenarios)
      .set({ title: "deleted" })
      .where(eq(customScenarios.id, id));
  }

  // Analytics
  async getDifficultyStats(): Promise<
    Array<{ difficulty: string; count: number; averageRating: number }>
  > {
    const stats = await db
      .select({
        difficulty: trainingSessions.difficultyLevel,
        count: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
      })
      .from(trainingSessions)
      .groupBy(trainingSessions.difficultyLevel);

    return stats.map((stat) => ({
      difficulty: stat.difficulty,
      count: Number(stat.count),
      averageRating: Number(stat.averageRating),
    }));
  }

  async getMonthlyStats(
    year: number,
    month: number,
  ): Promise<{ totalProblems: number; averageRating: number }> {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

    const [stats] = await db
      .select({
        totalProblems: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
      })
      .from(trainingSessions)
      .where(
        and(
          gte(trainingSessions.createdAt, new Date(startDate)),
          lte(trainingSessions.createdAt, new Date(endDate)),
        ),
      );

    return {
      totalProblems: Number(stats?.totalProblems || 0),
      averageRating: Number(stats?.averageRating || 0),
    };
  }

  async getUserSubscription(
    userId: string = "bizmowa.com",
  ): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    return subscription;
  }

  async updateUserSubscription(
    userId: string,
    subscriptionData: Partial<InsertUserSubscription>,
  ): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        ...subscriptionData,
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          ...subscriptionData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return subscription;
  }

  // Admin functions
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    activeSubscriptions: number;
    monthlyActiveUsers: number;
  }> {
    const [userCount] = await db
      .select({ count: count() })
      .from(userSubscriptions);

    const [sessionCount] = await db
      .select({ count: count() })
      .from(trainingSessions);

    const [activeSubscriptions] = await db
      .select({ count: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.subscriptionType, "premium"));

    return {
      totalUsers: userCount?.count || 0,
      totalSessions: sessionCount?.count || 0,
      activeSubscriptions: activeSubscriptions?.count || 0,
      monthlyActiveUsers: 0, // Placeholder for now
    };
  }

  async getAllUsers(): Promise<
    Array<{
      id: string;
      email: string;
      subscriptionType: string;
      isAdmin: boolean;
      createdAt: string;
      lastActive: string;
    }>
  > {
    const users = await db.select().from(userSubscriptions);
    return users.map((user) => ({
      id: user.userId,
      email: user.userId + "@example.com", // Placeholder email
      subscriptionType: user.subscriptionType,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.updatedAt.toISOString(),
    }));
  }

  async getLearningAnalytics(): Promise<{
    totalLearningTime: number;
    totalLearningCount: number;
    categoryStats: Array<{
      category: string;
      correctRate: number;
      totalAttempts: number;
    }>;
    monthlyStats: Array<{
      month: string;
      sessions: number;
      averageRating: number;
    }>;
  }> {
    const [sessionCount] = await db
      .select({ count: count() })
      .from(trainingSessions);

    const difficultyStats = await db
      .select({
        difficulty: trainingSessions.difficultyLevel,
        count: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating})::numeric, 1)`,
      })
      .from(trainingSessions)
      .groupBy(trainingSessions.difficultyLevel);

    const monthlyStats = await db
      .select({
        month: sql<string>`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`,
        sessions: count(),
        averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating})::numeric, 1)`,
      })
      .from(trainingSessions)
      .groupBy(sql`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`);

    return {
      totalLearningTime: (sessionCount?.count || 0) * 5, // Estimate 5 minutes per session
      totalLearningCount: sessionCount?.count || 0,
      categoryStats: difficultyStats.map((stat) => ({
        category: stat.difficulty,
        correctRate: Math.round((Number(stat.averageRating) / 5) * 100),
        totalAttempts: Number(stat.count),
      })),
      monthlyStats: monthlyStats.map((stat) => ({
        month: stat.month,
        sessions: Number(stat.sessions),
        averageRating: Number(stat.averageRating),
      })),
    };
  }

  async exportData(type: string): Promise<string> {
    if (type === "users") {
      const users = await this.getAllUsers();
      const headers =
        "ID,Email,Subscription Type,Is Admin,Created At,Last Active\n";
      const rows = users
        .map(
          (user) =>
            `${user.id},${user.email},${user.subscriptionType},${user.isAdmin},${user.createdAt},${user.lastActive}`,
        )
        .join("\n");
      return headers + rows;
    } else if (type === "sessions") {
      const sessions = await db.select().from(trainingSessions);
      const headers =
        "ID,Difficulty Level,Japanese Sentence,User Translation,Correct Translation,Rating,Created At\n";
      const rows = sessions
        .map(
          (session) =>
            `${session.id},"${session.difficultyLevel}","${session.japaneseSentence.replace(/"/g, '""')}","${session.userTranslation.replace(/"/g, '""')}","${session.correctTranslation.replace(/"/g, '""')}",${session.rating},${session.createdAt.toISOString()}`,
        )
        .join("\n");
      return headers + rows;
    }
    throw new Error("Invalid export type");
  }

  async getUserAttemptedProblems(
    difficultyLevel: string,
    userId: string = "bizmowa.com",
  ): Promise<Array<{ japaneseSentence: string }>> {
    const sessions = await db
      .select({ japaneseSentence: trainingSessions.japaneseSentence })
      .from(trainingSessions)
      .where(
        and(
          eq(trainingSessions.difficultyLevel, difficultyLevel),
          eq(trainingSessions.userId, userId),
        ),
      )
      .groupBy(trainingSessions.japaneseSentence);

    return sessions;
  }

  async getCurrentProblemNumber(
    userId: string,
    difficultyLevel: string,
  ): Promise<number> {
    const [progress] = await db
      .select({ currentProblemNumber: problemProgress.currentProblemNumber })
      .from(problemProgress)
      .where(
        and(
          eq(problemProgress.userId, userId),
          eq(problemProgress.difficultyLevel, difficultyLevel),
        ),
      );

    if (progress) {
      return progress.currentProblemNumber;
    }

    // If no progress record exists, initialize based on user's existing training sessions
    const [sessionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingSessions)
      .where(
        and(
          eq(trainingSessions.difficultyLevel, difficultyLevel),
          eq(trainingSessions.userId, userId),
        ),
      );

    const nextProblemNumber = (sessionCount?.count || 0) + 1;

    // Initialize the progress record
    await this.updateProblemProgress(
      userId,
      difficultyLevel,
      nextProblemNumber,
    );

    return nextProblemNumber;
  }

  async updateProblemProgress(
    userId: string,
    difficultyLevel: string,
    problemNumber: number,
  ): Promise<void> {
    await db
      .insert(problemProgress)
      .values({
        userId,
        difficultyLevel,
      })
      .onConflictDoUpdate({
        target: [problemProgress.userId, problemProgress.difficultyLevel],
        set: {
          difficultyLevel,
        },
      });
  }

  async resetUserData(userId: string = "default_user"): Promise<void> {
    // Reset all user data to initial state
    await db.delete(trainingSessions);
    await db.delete(dailyProgress);
    await db.delete(userGoals);
    await db.delete(customScenarios);
    await db.delete(problemProgress);

    // Reset user subscription to trial state
    await db
      .update(userSubscriptions)
      .set({
        subscriptionType: "trialing",
        trialStart: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));
  }
}

export const storage = new DatabaseStorage();
