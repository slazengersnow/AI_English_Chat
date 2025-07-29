"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const schema_1 = require("@shared/schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
class DatabaseStorage {
    // Training sessions
    async addTrainingSession(sessionData) {
        const [session] = await db_1.db
            .insert(schema_1.trainingSessions)
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
            difficultyLevel: session.difficultyLevel,
            createdAt: session.createdAt ?? new Date(),
            lastReviewed: session.lastReviewed ?? null,
            isBookmarked: session.isBookmarked || false,
            reviewCount: session.reviewCount || 0,
        };
    }
    async getTrainingSessions() {
        const sessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt ?? new Date(),
            lastReviewed: session.lastReviewed ?? null,
            isBookmarked: session.isBookmarked || false,
            reviewCount: session.reviewCount || 0,
        }));
    }
    async getSessionsByDifficulty(difficultyLevel) {
        const sessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.trainingSessions.difficultyLevel, difficultyLevel))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? null,
        }));
    }
    async updateBookmark(sessionId, isBookmarked) {
        await db_1.db
            .update(schema_1.trainingSessions)
            .set({ rating: 0 })
            .where((0, drizzle_orm_1.eq)(schema_1.trainingSessions.id, sessionId));
    }
    async getSessionsForReview(ratingThreshold) {
        const sessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.lte)(schema_1.trainingSessions.rating, ratingThreshold))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? null,
        }));
    }
    async getBookmarkedSessions() {
        const sessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.trainingSessions.isBookmarked, true))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? null,
        }));
    }
    async updateReviewCount(sessionId) {
        await db_1.db
            .update(schema_1.trainingSessions)
            .set({
            rating: (0, drizzle_orm_1.sql) `${schema_1.trainingSessions.rating} + 1`,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.trainingSessions.id, sessionId));
    }
    async getRecentSessions(daysBack = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        const sessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.gte)(schema_1.trainingSessions.createdAt, cutoffDate))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trainingSessions.createdAt))
            .limit(50); // Limit to prevent too many results
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? null,
        }));
    }
    // User goals
    async getUserGoals() {
        const [goal] = await db_1.db
            .select()
            .from(schema_1.userGoals)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userGoals.createdAt))
            .limit(1);
        if (!goal)
            return undefined;
        return {
            ...goal,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
        };
    }
    async updateUserGoals(goalData) {
        const [goal] = await db_1.db
            .insert(schema_1.userGoals)
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
    async getDailyProgress(date) {
        const [progress] = await db_1.db
            .select()
            .from(schema_1.dailyProgress)
            .where((0, drizzle_orm_1.eq)(schema_1.dailyProgress.date, date));
        if (!progress)
            return undefined;
        return {
            ...progress,
            createdAt: progress.createdAt,
            dailyCount: progress.dailyCount,
        };
    }
    async updateDailyProgress(date, problemsCompleted, averageRating) {
        const [progress] = await db_1.db
            .insert(schema_1.dailyProgress)
            .values({
            date,
        })
            .onConflictDoUpdate({
            target: schema_1.dailyProgress.date,
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
    async updateDailyProgressForDate(date) {
        const todaySessions = await db_1.db
            .select()
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.trainingSessions.createdAt, new Date(date + "T00:00:00Z")), (0, drizzle_orm_1.lte)(schema_1.trainingSessions.createdAt, new Date(date + "T23:59:59Z"))));
        if (todaySessions.length > 0) {
            const averageRating = Math.round(todaySessions.reduce((sum, session) => sum + session.rating, 0) /
                todaySessions.length);
            await this.updateDailyProgress(date, todaySessions.length, averageRating);
        }
    }
    async getProgressHistory(startDate, endDate) {
        const progress = await db_1.db
            .select()
            .from(schema_1.dailyProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.dailyProgress.date, startDate), (0, drizzle_orm_1.lte)(schema_1.dailyProgress.date, endDate)))
            .orderBy(schema_1.dailyProgress.date);
        return progress.map((p) => ({
            ...p,
            createdAt: p.createdAt,
            dailyCount: p.dailyCount,
        }));
    }
    async getStreakCount() {
        const recent = await db_1.db
            .select({ date: schema_1.dailyProgress.date })
            .from(schema_1.dailyProgress)
            .where((0, drizzle_orm_1.gte)(schema_1.dailyProgress.problemsCompleted, 1))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.dailyProgress.date))
            .limit(365);
        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today);
        for (const record of recent) {
            const recordDate = new Date(record.date);
            if (recordDate.toDateString() === checkDate.toDateString()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        return streak;
    }
    // Daily limit functionality
    async getTodaysProblemCount() {
        const today = new Date().toISOString().split("T")[0];
        const progress = await this.getDailyProgress(today);
        return progress?.dailyCount || 0;
    }
    async incrementDailyCount() {
        const today = new Date().toISOString().split("T")[0];
        const currentCount = await this.getTodaysProblemCount();
        // Check if limit reached
        if (currentCount >= 100) {
            return false;
        }
        // Increment count
        await db_1.db
            .insert(schema_1.dailyProgress)
            .values({
            date: today,
        })
            .onConflictDoUpdate({
            target: schema_1.dailyProgress.date,
            set: {
                date: today,
            },
        });
        return true;
    }
    async resetDailyCount(date) {
        const targetDate = date || new Date().toISOString().split("T")[0];
        await db_1.db
            .insert(schema_1.dailyProgress)
            .values({
            date: targetDate,
        })
            .onConflictDoUpdate({
            target: schema_1.dailyProgress.date,
            set: {
                date: targetDate,
            },
        });
    }
    // Custom scenarios
    async getCustomScenarios() {
        const scenarios = await db_1.db
            .select()
            .from(schema_1.customScenarios)
            .where((0, drizzle_orm_1.eq)(schema_1.customScenarios.isActive, true))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.customScenarios.createdAt));
        return scenarios.map((scenario) => ({
            ...scenario,
            createdAt: scenario.createdAt ?? new Date(),
            isActive: scenario.isActive,
        }));
    }
    async getCustomScenario(id) {
        const [scenario] = await db_1.db
            .select()
            .from(schema_1.customScenarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.customScenarios.id, id), (0, drizzle_orm_1.eq)(schema_1.customScenarios.isActive, true)));
        if (!scenario)
            return undefined;
        return {
            ...scenario,
            createdAt: scenario.createdAt ?? new Date(),
            isActive: scenario.isActive || true,
        };
    }
    async addCustomScenario(scenarioData) {
        const [scenario] = await db_1.db
            .insert(schema_1.customScenarios)
            .values({
            title: scenarioData.title,
            description: scenarioData.description,
        })
            .returning();
        return scenario;
    }
    async updateCustomScenario(id, scenarioData) {
        const updateData = {};
        if (scenarioData.title !== undefined)
            updateData.title = scenarioData.title;
        if (scenarioData.description !== undefined)
            updateData.description = scenarioData.description;
        if (scenarioData.isActive !== undefined)
            updateData.isActive = scenarioData.isActive;
        const [scenario] = await db_1.db
            .update(schema_1.customScenarios)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.customScenarios.id, id))
            .returning();
        return scenario;
    }
    async deleteCustomScenario(id) {
        await db_1.db
            .update(schema_1.customScenarios)
            .set({ title: "deleted" })
            .where((0, drizzle_orm_1.eq)(schema_1.customScenarios.id, id));
    }
    // Analytics
    async getDifficultyStats() {
        const stats = await db_1.db
            .select({
            difficulty: schema_1.trainingSessions.difficultyLevel,
            count: (0, drizzle_orm_1.count)(),
            averageRating: (0, drizzle_orm_1.sql) `ROUND(AVG(${schema_1.trainingSessions.rating}), 1)`,
        })
            .from(schema_1.trainingSessions)
            .groupBy(schema_1.trainingSessions.difficultyLevel);
        return stats.map((stat) => ({
            difficulty: stat.difficulty,
            count: Number(stat.count),
            averageRating: Number(stat.averageRating),
        }));
    }
    async getMonthlyStats(year, month) {
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;
        const [stats] = await db_1.db
            .select({
            totalProblems: (0, drizzle_orm_1.count)(),
            averageRating: (0, drizzle_orm_1.sql) `ROUND(AVG(${schema_1.trainingSessions.rating}), 1)`,
        })
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.trainingSessions.createdAt, new Date(startDate)), (0, drizzle_orm_1.lte)(schema_1.trainingSessions.createdAt, new Date(endDate))));
        return {
            totalProblems: Number(stats?.totalProblems || 0),
            averageRating: Number(stats?.averageRating || 0),
        };
    }
    async getUserSubscription(userId = "bizmowa.com") {
        const [subscription] = await db_1.db
            .select()
            .from(schema_1.userSubscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.userSubscriptions.userId, userId));
        return subscription;
    }
    async updateUserSubscription(userId, subscriptionData) {
        const [subscription] = await db_1.db
            .insert(schema_1.userSubscriptions)
            .values({
            userId,
            ...subscriptionData,
        })
            .onConflictDoUpdate({
            target: schema_1.userSubscriptions.userId,
            set: {
                ...subscriptionData,
                updatedAt: new Date(),
            },
        })
            .returning();
        return subscription;
    }
    // Admin functions
    async getAdminStats() {
        const [userCount] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.userSubscriptions);
        const [sessionCount] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.trainingSessions);
        const [activeSubscriptions] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.userSubscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.userSubscriptions.subscriptionType, "premium"));
        return {
            totalUsers: userCount?.count || 0,
            totalSessions: sessionCount?.count || 0,
            activeSubscriptions: activeSubscriptions?.count || 0,
            monthlyActiveUsers: 0, // Placeholder for now
        };
    }
    async getAllUsers() {
        const users = await db_1.db.select().from(schema_1.userSubscriptions);
        return users.map((user) => ({
            id: user.userId,
            email: user.userId + "@example.com", // Placeholder email
            subscriptionType: user.subscriptionType,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt.toISOString(),
            lastActive: user.updatedAt.toISOString(),
        }));
    }
    async getLearningAnalytics() {
        const [sessionCount] = await db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.trainingSessions);
        const difficultyStats = await db_1.db
            .select({
            difficulty: schema_1.trainingSessions.difficultyLevel,
            count: (0, drizzle_orm_1.count)(),
            averageRating: (0, drizzle_orm_1.sql) `ROUND(AVG(${schema_1.trainingSessions.rating})::numeric, 1)`,
        })
            .from(schema_1.trainingSessions)
            .groupBy(schema_1.trainingSessions.difficultyLevel);
        const monthlyStats = await db_1.db
            .select({
            month: (0, drizzle_orm_1.sql) `TO_CHAR(${schema_1.trainingSessions.createdAt}, 'YYYY-MM')`,
            sessions: (0, drizzle_orm_1.count)(),
            averageRating: (0, drizzle_orm_1.sql) `ROUND(AVG(${schema_1.trainingSessions.rating})::numeric, 1)`,
        })
            .from(schema_1.trainingSessions)
            .groupBy((0, drizzle_orm_1.sql) `TO_CHAR(${schema_1.trainingSessions.createdAt}, 'YYYY-MM')`)
            .orderBy((0, drizzle_orm_1.sql) `TO_CHAR(${schema_1.trainingSessions.createdAt}, 'YYYY-MM')`);
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
    async exportData(type) {
        if (type === "users") {
            const users = await this.getAllUsers();
            const headers = "ID,Email,Subscription Type,Is Admin,Created At,Last Active\n";
            const rows = users
                .map((user) => `${user.id},${user.email},${user.subscriptionType},${user.isAdmin},${user.createdAt},${user.lastActive}`)
                .join("\n");
            return headers + rows;
        }
        else if (type === "sessions") {
            const sessions = await db_1.db.select().from(schema_1.trainingSessions);
            const headers = "ID,Difficulty Level,Japanese Sentence,User Translation,Correct Translation,Rating,Created At\n";
            const rows = sessions
                .map((session) => `${session.id},"${session.difficultyLevel}","${session.japaneseSentence.replace(/"/g, '""')}","${session.userTranslation.replace(/"/g, '""')}","${session.correctTranslation.replace(/"/g, '""')}",${session.rating},${session.createdAt.toISOString()}`)
                .join("\n");
            return headers + rows;
        }
        throw new Error("Invalid export type");
    }
    async getUserAttemptedProblems(difficultyLevel, userId = "bizmowa.com") {
        const sessions = await db_1.db
            .select({ japaneseSentence: schema_1.trainingSessions.japaneseSentence })
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trainingSessions.difficultyLevel, difficultyLevel), (0, drizzle_orm_1.eq)(schema_1.trainingSessions.userId, userId)))
            .groupBy(schema_1.trainingSessions.japaneseSentence);
        return sessions;
    }
    async getCurrentProblemNumber(userId, difficultyLevel) {
        const [progress] = await db_1.db
            .select({ currentProblemNumber: schema_1.problemProgress.currentProblemNumber })
            .from(schema_1.problemProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.problemProgress.userId, userId), (0, drizzle_orm_1.eq)(schema_1.problemProgress.difficultyLevel, difficultyLevel)));
        if (progress) {
            return progress.currentProblemNumber;
        }
        // If no progress record exists, initialize based on user's existing training sessions
        const [sessionCount] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.trainingSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trainingSessions.difficultyLevel, difficultyLevel), (0, drizzle_orm_1.eq)(schema_1.trainingSessions.userId, userId)));
        const nextProblemNumber = (sessionCount?.count || 0) + 1;
        // Initialize the progress record
        await this.updateProblemProgress(userId, difficultyLevel, nextProblemNumber);
        return nextProblemNumber;
    }
    async updateProblemProgress(userId, difficultyLevel, problemNumber) {
        await db_1.db
            .insert(schema_1.problemProgress)
            .values({
            userId,
            difficultyLevel,
        })
            .onConflictDoUpdate({
            target: [schema_1.problemProgress.userId, schema_1.problemProgress.difficultyLevel],
            set: {
                difficultyLevel,
            },
        });
    }
    async resetUserData(userId = "default_user") {
        // Reset all user data to initial state
        await db_1.db.delete(schema_1.trainingSessions);
        await db_1.db.delete(schema_1.dailyProgress);
        await db_1.db.delete(schema_1.userGoals);
        await db_1.db.delete(schema_1.customScenarios);
        await db_1.db.delete(schema_1.problemProgress);
        // Reset user subscription to trial state
        await db_1.db
            .update(schema_1.userSubscriptions)
            .set({
            subscriptionType: "trialing",
            trialStart: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userSubscriptions.userId, userId));
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
