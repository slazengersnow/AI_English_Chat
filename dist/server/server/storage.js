import { trainingSessions, userGoals, dailyProgress, customScenarios, userSubscriptions, problemProgress, } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
import { pgTable, serial, varchar, text, integer, boolean, timestamp, date, } from "drizzle-orm/pg-core";
// Training Sessions Table
export const trainingSessions = pgTable("training_sessions", {
    id: serial("id").primaryKey(),
    difficultyLevel: varchar("difficulty_level", { length: 50 }),
    japaneseSentence: text("japanese_sentence"),
    userTranslation: text("user_translation"),
    correctTranslation: text("correct_translation"),
    feedback: text("feedback"),
    rating: integer("rating"),
    userId: varchar("user_id", { length: 255 }),
    isBookmarked: boolean("is_bookmarked").default(false),
    reviewCount: integer("review_count").default(0),
    lastReviewed: timestamp("last_reviewed"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Daily Progress Table
export const dailyProgress = pgTable("daily_progress", {
    date: date("date").primaryKey(),
    dailyCount: integer("daily_count").default(0),
    problemsCompleted: integer("problems_completed").default(0),
    averageRating: integer("average_rating").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
// Custom Scenarios Table
export const customScenarios = pgTable("custom_scenarios", {
    id: serial("id").primaryKey(),
    title: text("title"),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
// Problem Progress Table
export const problemProgress = pgTable("problem_progress", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }),
    difficultyLevel: varchar("difficulty_level", { length: 50 }),
    currentProblemNumber: integer("current_problem_number").default(1),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export class DatabaseStorage {
    // Training sessions
    async addTrainingSession(sessionData) {
        const [session] = await db
            .insert(trainingSessions)
            .values({
            difficultyLevel: sessionData.difficultyLevel,
            japaneseSentence: sessionData.japaneseSentence,
            userTranslation: sessionData.userTranslation,
            correctTranslation: sessionData.correctTranslation,
            feedback: sessionData.feedback,
            rating: sessionData.rating,
            userId: sessionData.userId || "default_user",
        })
            .returning();
        // Update daily progress
        const today = new Date().toISOString().split("T")[0];
        await this.updateDailyProgressForDate(today);
        return {
            ...session,
            difficultyLevel: session.difficultyLevel,
            createdAt: session.createdAt ?? new Date(),
            lastReviewed: session.lastReviewed ?? undefined,
            isBookmarked: session.isBookmarked || false,
            reviewCount: session.reviewCount || 0,
        };
    }
    async getTrainingSessions() {
        const sessions = await db
            .select()
            .from(trainingSessions)
            .orderBy(desc(trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt ?? new Date(),
            lastReviewed: session.lastReviewed ?? undefined,
            isBookmarked: session.isBookmarked || false,
            reviewCount: session.reviewCount || 0,
        }));
    }
    async getSessionsByDifficulty(difficultyLevel) {
        const sessions = await db
            .select()
            .from(trainingSessions)
            .where(eq(trainingSessions.difficultyLevel, difficultyLevel))
            .orderBy(desc(trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? undefined,
        }));
    }
    async updateBookmark(sessionId, isBookmarked) {
        await db
            .update(trainingSessions)
            .set({ isBookmarked })
            .where(eq(trainingSessions.id, sessionId));
    }
    async getSessionsForReview(ratingThreshold) {
        const sessions = await db
            .select()
            .from(trainingSessions)
            .where(lte(trainingSessions.rating, ratingThreshold))
            .orderBy(desc(trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? undefined,
        }));
    }
    async getBookmarkedSessions() {
        const sessions = await db
            .select()
            .from(trainingSessions)
            .where(eq(trainingSessions.isBookmarked, true))
            .orderBy(desc(trainingSessions.createdAt));
        return sessions.map((session) => ({
            ...session,
            createdAt: session.createdAt,
            lastReviewed: session.lastReviewed ?? undefined,
        }));
    }
    async updateReviewCount(sessionId) {
        await db
            .update(trainingSessions)
            .set({
            reviewCount: sql `${trainingSessions.reviewCount} + 1`,
            lastReviewed: new Date(),
        })
            .where(eq(trainingSessions.id, sessionId));
    }
    async getRecentSessions(daysBack = 7) {
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
            lastReviewed: session.lastReviewed ?? undefined,
        }));
    }
    // User goals
    async getUserGoals() {
        const [goal] = await db
            .select()
            .from(userGoals)
            .orderBy(desc(userGoals.createdAt))
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
    async getDailyProgress(date) {
        const [progress] = await db
            .select()
            .from(dailyProgress)
            .where(eq(dailyProgress.date, date));
        if (!progress)
            return undefined;
        return {
            ...progress,
            createdAt: progress.createdAt,
            dailyCount: progress.dailyCount,
        };
    }
    async updateDailyProgress(date, problemsCompleted, averageRating) {
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
            createdAt: progress.createdAt,
            dailyCount: progress.dailyCount,
        };
    }
    async updateDailyProgressForDate(date) {
        const todaySessions = await db
            .select()
            .from(trainingSessions)
            .where(and(gte(trainingSessions.createdAt, new Date(date + "T00:00:00Z")), lte(trainingSessions.createdAt, new Date(date + "T23:59:59Z"))));
        if (todaySessions.length > 0) {
            const averageRating = Math.round(todaySessions.reduce((sum, session) => sum + session.rating, 0) /
                todaySessions.length);
            await this.updateDailyProgress(date, todaySessions.length, averageRating);
        }
    }
    async getProgressHistory(startDate, endDate) {
        const progress = await db
            .select()
            .from(dailyProgress)
            .where(and(gte(dailyProgress.date, startDate), lte(dailyProgress.date, endDate)))
            .orderBy(dailyProgress.date);
        return progress.map((p) => ({
            ...p,
            createdAt: p.createdAt,
            dailyCount: p.dailyCount,
        }));
    }
    async getStreakCount() {
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
        await db
            .insert(dailyProgress)
            .values({
            date: today,
            dailyCount: currentCount + 1,
            problemsCompleted: 0,
            averageRating: 0,
        })
            .onConflictDoUpdate({
            target: dailyProgress.date,
            set: {
                dailyCount: currentCount + 1,
            },
        });
        return true;
    }
    async resetDailyCount(date) {
        const targetDate = date || new Date().toISOString().split("T")[0];
        await db
            .insert(dailyProgress)
            .values({
            date: targetDate,
            dailyCount: 0,
            problemsCompleted: 0,
            averageRating: 0,
        })
            .onConflictDoUpdate({
            target: dailyProgress.date,
            set: {
                dailyCount: 0,
            },
        });
    }
    // Custom scenarios
    async getCustomScenarios() {
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
    async getCustomScenario(id) {
        const [scenario] = await db
            .select()
            .from(customScenarios)
            .where(and(eq(customScenarios.id, id), eq(customScenarios.isActive, true)));
        if (!scenario)
            return undefined;
        return {
            ...scenario,
            createdAt: scenario.createdAt ?? new Date(),
            isActive: scenario.isActive || true,
        };
    }
    async addCustomScenario(scenarioData) {
        const [scenario] = await db
            .insert(customScenarios)
            .values(scenarioData)
            .returning();
        return {
            ...scenario,
            createdAt: scenario.createdAt ?? new Date(),
            isActive: scenario.isActive || true,
        };
    }
    async updateCustomScenario(id, scenarioData) {
        const [scenario] = await db
            .update(customScenarios)
            .set(scenarioData)
            .where(eq(customScenarios.id, id))
            .returning();
        return {
            ...scenario,
            createdAt: scenario.createdAt ?? new Date(),
            isActive: scenario.isActive || true,
        };
    }
    async deleteCustomScenario(id) {
        await db
            .update(customScenarios)
            .set({ isActive: false })
            .where(eq(customScenarios.id, id));
    }
    // Analytics
    async getDifficultyStats() {
        const stats = await db
            .select({
            difficulty: trainingSessions.difficultyLevel,
            count: count(),
            averageRating: sql `ROUND(AVG(${trainingSessions.rating}), 1)`,
        })
            .from(trainingSessions)
            .groupBy(trainingSessions.difficultyLevel);
        return stats.map((stat) => ({
            difficulty: stat.difficulty,
            count: Number(stat.count),
            averageRating: Number(stat.averageRating),
        }));
    }
    async getMonthlyStats(year, month) {
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;
        const [stats] = await db
            .select({
            totalProblems: count(),
            averageRating: sql `ROUND(AVG(${trainingSessions.rating}), 1)`,
        })
            .from(trainingSessions)
            .where(and(gte(trainingSessions.createdAt, new Date(startDate)), lte(trainingSessions.createdAt, new Date(endDate))));
        return {
            totalProblems: Number(stats?.totalProblems || 0),
            averageRating: Number(stats?.averageRating || 0),
        };
    }
    async getUserSubscription(userId = "bizmowa.com") {
        const [subscription] = await db
            .select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.userId, userId));
        return subscription;
    }
    async updateUserSubscription(userId, subscriptionData) {
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
    async getAdminStats() {
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
    async getAllUsers() {
        const users = await db.select().from(userSubscriptions);
        return users.map((user) => ({
            id: user.userId,
            email: user.userId + "@example.com", // Placeholder email
            subscriptionType: user.subscriptionType,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            lastActive: user.updatedAt,
        }));
    }
    async getLearningAnalytics() {
        const [sessionCount] = await db
            .select({ count: count() })
            .from(trainingSessions);
        const difficultyStats = await db
            .select({
            difficulty: trainingSessions.difficultyLevel,
            count: count(),
            averageRating: sql `ROUND(AVG(${trainingSessions.rating})::numeric, 1)`,
        })
            .from(trainingSessions)
            .groupBy(trainingSessions.difficultyLevel);
        const monthlyStats = await db
            .select({
            month: sql `TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`,
            sessions: count(),
            averageRating: sql `ROUND(AVG(${trainingSessions.rating})::numeric, 1)`,
        })
            .from(trainingSessions)
            .groupBy(sql `TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`)
            .orderBy(sql `TO_CHAR(${trainingSessions.createdAt}, 'YYYY-MM')`);
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
            const sessions = await db.select().from(trainingSessions);
            const headers = "ID,Difficulty Level,Japanese Sentence,User Translation,Correct Translation,Rating,Created At\n";
            const rows = sessions
                .map((session) => `${session.id},"${session.difficultyLevel}","${session.japaneseSentence.replace(/"/g, '""')}","${session.userTranslation.replace(/"/g, '""')}","${session.correctTranslation.replace(/"/g, '""')}",${session.rating},${session.createdAt.toISOString()}`)
                .join("\n");
            return headers + rows;
        }
        throw new Error("Invalid export type");
    }
    async getUserAttemptedProblems(difficultyLevel, userId = "bizmowa.com") {
        const sessions = await db
            .select({ japaneseSentence: trainingSessions.japaneseSentence })
            .from(trainingSessions)
            .where(and(eq(trainingSessions.difficultyLevel, difficultyLevel), eq(trainingSessions.userId, userId)))
            .groupBy(trainingSessions.japaneseSentence);
        return sessions;
    }
    async getCurrentProblemNumber(userId, difficultyLevel) {
        const [progress] = await db
            .select({ currentProblemNumber: problemProgress.currentProblemNumber })
            .from(problemProgress)
            .where(and(eq(problemProgress.userId, userId), eq(problemProgress.difficultyLevel, difficultyLevel)));
        if (progress) {
            return progress.currentProblemNumber;
        }
        // If no progress record exists, initialize based on user's existing training sessions
        const [sessionCount] = await db
            .select({ count: sql `count(*)` })
            .from(trainingSessions)
            .where(and(eq(trainingSessions.difficultyLevel, difficultyLevel), eq(trainingSessions.userId, userId)));
        const nextProblemNumber = (sessionCount?.count || 0) + 1;
        // Initialize the progress record
        await this.updateProblemProgress(userId, difficultyLevel, nextProblemNumber);
        return nextProblemNumber;
    }
    async updateProblemProgress(userId, difficultyLevel, problemNumber) {
        await db
            .insert(problemProgress)
            .values({
            userId,
            difficultyLevel,
            currentProblemNumber: problemNumber,
        })
            .onConflictDoUpdate({
            target: [problemProgress.userId, problemProgress.difficultyLevel],
            set: {
                currentProblemNumber: problemNumber,
                updatedAt: new Date(),
            },
        });
    }
    async resetUserData(userId = "default_user") {
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
