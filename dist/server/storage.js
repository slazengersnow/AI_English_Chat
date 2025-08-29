import { db } from "./db.js";
import { trainingSessions } from "../shared/schema.js";
import { eq } from "drizzle-orm";
// 実際のデータベース接続を使用するストレージ
export class Storage {
    async addTrainingSession(data) {
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
        }
        catch (error) {
            console.error("Failed to add training session:", error);
            throw error;
        }
    }
    async getTrainingSessions(userId) {
        try {
            const sessions = await db
                .select()
                .from(trainingSessions)
                .where(eq(trainingSessions.userId, userId));
            return sessions;
        }
        catch (error) {
            console.error("Failed to get training sessions:", error);
            return [];
        }
    }
    async getUserGoals(userId) {
        return [];
    }
    async updateUserGoals(userId, data) {
        return {};
    }
    async getStreakCount(userId) {
        return 0;
    }
    async getDifficultyStats(userId) {
        return {};
    }
    async getMonthlyStats(userId, year, month) {
        return {};
    }
    async getSessionsForReview(userId, threshold) {
        return [];
    }
    async getRecentSessions(userId, daysBack) {
        return [];
    }
    async getBookmarkedSessions(userId) {
        return [];
    }
    async updateBookmark(sessionId, isBookmarked) {
        // ダミー実装
    }
    async updateReviewCount(sessionId) {
        // ダミー実装
    }
    async getCustomScenarios(userId) {
        return [];
    }
    async updateCustomScenario(id, data) {
        return {};
    }
    async deleteCustomScenario(id) {
        // ダミー実装
    }
    async getCustomScenario(id) {
        return {};
    }
    async getTodaysProblemCount(userId) {
        return 0;
    }
    async incrementDailyCount() {
        // ダミー実装：常に許可
        return true;
    }
}
// デフォルトエクスポート
const storage = new Storage();
export default storage;
