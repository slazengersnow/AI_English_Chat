import { db } from "./db.js";
import { DAILY_PROBLEM_LIMIT, ADMIN_EMAIL } from "../shared/constants.js";
import { trainingSessions, dailyRequests } from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

// 実際のデータベース接続を使用するストレージ
export class Storage {
  // Expose db for admin routes
  public db = db;
  
  async addTrainingSession(data: {
    userId: string;
    difficultyLevel: string;
    japaneseSentence: string;
    userTranslation: string;
    correctTranslation: string;
    feedback: string;
    rating: number;
  }): Promise<any> {
    try {
      const [session] = await db
        .insert(trainingSessions)
        .values({
          userId: data.userId,
          difficultyLevel: data.difficultyLevel,
          japaneseSentence: data.japaneseSentence,
          userTranslation: data.userTranslation,
          correctTranslation: data.correctTranslation,
          feedback: data.feedback,
          rating: data.rating,
        })
        .returning();
      return session;
    } catch (error) {
      console.error("Failed to add training session:", error);
      throw error;
    }
  }

  async getTrainingSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.userId, userId));
      return sessions;
    } catch (error) {
      console.error("Failed to get training sessions:", error);
      return [];
    }
  }

  async getUserGoals(userId: string): Promise<any[]> {
    return [];
  }

  async updateUserGoals(userId: string, data: any): Promise<any> {
    return {};
  }

  async getStreakCount(userId: string): Promise<number> {
    try {
      // 連続学習日数を計算（実装を簡略化）
      const sessions = await this.getTrainingSessions(userId);
      if (sessions.length === 0) return 0;
      
      // 最近のセッションから連続日数を計算
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const recentSessions = sessions.filter(s => 
        new Date(s.createdAt) >= yesterday
      );
      
      return recentSessions.length > 0 ? Math.min(sessions.length, 7) : 0;
    } catch (error) {
      console.error("Failed to get streak count:", error);
      return 0;
    }
  }

  async getDifficultyStats(userId: string): Promise<any[]> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const statsMap = new Map();
      
      sessions.forEach(session => {
        const key = session.difficultyLevel;
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            difficulty: key,
            totalSessions: 0,
            averageRating: 0,
            totalRating: 0
          });
        }
        
        const stats = statsMap.get(key);
        stats.totalSessions += 1;
        stats.totalRating += session.rating;
        stats.averageRating = stats.totalRating / stats.totalSessions;
      });
      
      return Array.from(statsMap.values()).map(stats => ({
        difficulty: stats.difficulty,
        completed: stats.totalSessions,
        averageRating: Math.round(stats.averageRating * 10) / 10
      }));
    } catch (error) {
      console.error("Failed to get difficulty stats:", error);
      return [];
    }
  }

  async getMonthlyStats(userId: string): Promise<any[]> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const monthlyMap = new Map();
      
      sessions.forEach(session => {
        const date = new Date(session.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: monthKey,
            completed: 0,
            averageRating: 0,
            totalRating: 0
          });
        }
        
        const stats = monthlyMap.get(monthKey);
        stats.completed += 1;
        stats.totalRating += session.rating;
        stats.averageRating = stats.totalRating / stats.completed;
      });
      
      // 最近3ヶ月のデータを返す
      const result = Array.from(monthlyMap.values())
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 3)
        .map(stats => ({
          month: stats.month,
          completed: stats.completed,
          averageRating: Math.round(stats.averageRating * 10) / 10
        }));
      
      return result;
    } catch (error) {
      console.error("Failed to get monthly stats:", error);
      return [];
    }
  }

  async getSessionsForReview(
    userId: string,
    threshold: string = "3",
  ): Promise<any[]> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const ratingThreshold = parseInt(threshold);
      
      return sessions
        .filter(session => session.rating <= ratingThreshold)
        .slice(0, 10) // 最大10件
        .map(session => ({
          id: session.id,
          japaneseSentence: session.japaneseSentence,
          userTranslation: session.userTranslation,
          correctTranslation: session.correctTranslation,
          rating: session.rating,
          difficultyLevel: session.difficultyLevel,
          createdAt: session.createdAt
        }));
    } catch (error) {
      console.error("Failed to get sessions for review:", error);
      return [];
    }
  }

  async getRecentSessions(userId: string, daysBack: string = "7"): Promise<any[]> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const days = parseInt(daysBack);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return sessions
        .filter(session => new Date(session.createdAt) >= cutoffDate)
        .slice(0, 20) // 最大20件
        .map(session => ({
          id: session.id,
          japaneseSentence: session.japaneseSentence,
          userTranslation: session.userTranslation,
          rating: session.rating,
          difficultyLevel: session.difficultyLevel,
          createdAt: session.createdAt
        }));
    } catch (error) {
      console.error("Failed to get recent sessions:", error);
      return [];
    }
  }

  async getBookmarkedSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      
      return sessions
        .filter(session => session.isBookmarked)
        .slice(0, 50) // 最大50件
        .map(session => ({
          id: session.id,
          japaneseSentence: session.japaneseSentence,
          userTranslation: session.userTranslation,
          correctTranslation: session.correctTranslation,
          rating: session.rating,
          difficultyLevel: session.difficultyLevel,
          createdAt: session.createdAt
        }));
    } catch (error) {
      console.error("Failed to get bookmarked sessions:", error);
      return [];
    }
  }

  async updateBookmark(
    sessionId: string,
    isBookmarked: boolean,
  ): Promise<void> {
    try {
      await db
        .update(trainingSessions)
        .set({ isBookmarked })
        .where(eq(trainingSessions.id, parseInt(sessionId)));
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      throw error;
    }
  }

  async updateReviewCount(sessionId: string): Promise<void> {
    // ダミー実装
  }

  async getCustomScenarios(userId: string): Promise<any[]> {
    return [];
  }

  async updateCustomScenario(id: string, data: any): Promise<any> {
    return {};
  }

  async deleteCustomScenario(id: string): Promise<void> {
    // ダミー実装
  }

  async getCustomScenario(id: string): Promise<any> {
    return {};
  }

  async getTodaysProblemCount(userId: string): Promise<number> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      });
      
      return todaySessions.length;
    } catch (error) {
      console.error("Failed to get today's problem count:", error);
      return 0;
    }
  }

  async getTodaysRequestCount(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const result = await db
        .select({ requestCount: dailyRequests.requestCount })
        .from(dailyRequests)
        .where(and(
          eq(dailyRequests.userId, userId),
          eq(dailyRequests.requestDate, today)
        ));
      
      const count = result.length > 0 ? result[0].requestCount : 0;
      console.log(`📊 Today's request count for user ${userId}: ${count}`);
      
      return count;
    } catch (error) {
      console.error("Failed to get today's request count:", error);
      return 0;
    }
  }

  async incrementDailyCount(userId: string = "default_user", userEmail?: string): Promise<boolean> {
    try {
      // ✅ 管理者チェック - emailで比較（修正済み）
      if (userEmail === ADMIN_EMAIL) {
        console.log(`🔑 Admin user bypassing daily limit: ${userEmail}`);
        return true;
      }
      
      // 今日のリクエスト数を取得（修正済み：dailyRequestsテーブルを使用）
      const todayCount = await this.getTodaysRequestCount(userId);
      
      // 制限に達している場合は拒否
      if (todayCount >= DAILY_PROBLEM_LIMIT) {
        console.log(`❌ Daily limit reached: ${todayCount}/${DAILY_PROBLEM_LIMIT} for user ${userId} (${userEmail || 'unknown'})`);
        return false;
      }
      
      // ✅ 実際にカウンターを増加（修正済み：実装していた不備を修正）
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // INSERT ON CONFLICT UPDATE pattern でカウンターを安全に増加
        await db
          .insert(dailyRequests)
          .values({
            userId,
            userEmail: userEmail || null,
            requestDate: today,
            requestCount: 1,
          })
          .onConflictDoUpdate({
            target: [dailyRequests.userId, dailyRequests.requestDate],
            set: {
              requestCount: sql`${dailyRequests.requestCount} + 1`,
              userEmail: userEmail || null,
              updatedAt: new Date(),
            },
          });
        
        const newCount = todayCount + 1;
        console.log(`✅ Daily request count incremented: ${newCount}/${DAILY_PROBLEM_LIMIT} for user ${userId} (${userEmail || 'unknown'})`);
        return true;
        
      } catch (insertError) {
        console.error("Failed to increment daily request count:", insertError);
        return false;
      }
      
    } catch (error) {
      console.error("Failed to process daily count:", error);
      return false;
    }
  }
}

// デフォルトエクスポート
const storage = new Storage();
export default storage;

// getStorage function for admin routes
export function getStorage() {
  return {
    db: storage.db,
  };
}

// Export the db for direct access
export { db } from "./db.js";
