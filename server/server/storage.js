"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
// 最小限のストレージモック
class Storage {
    // ダミー実装
    async getTrainingSessions(userId) {
        return [];
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
exports.Storage = Storage;
// デフォルトエクスポート
const storage = new Storage();
exports.default = storage;
