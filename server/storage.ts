import { db } from "./db.js";
import { trainingSessions } from "../shared/schema.js";
import { eq } from "drizzle-orm";

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

  async incrementDailyCount(): Promise<boolean> {
    // 実装を簡略化：常に許可（1日100問制限は別途実装）
    return true;
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
