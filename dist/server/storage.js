import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc, gte } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@shared/schema";
const { trainingSessions, userGoals, dailyProgress, customScenarios, } = schema;
// Database connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });
// CRITICAL: Daily limit system - In-memory counter
const DAILY_LIMIT = 100;
const dailyCounters = new Map();
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
function getDailyCount(userId = "bizmowa.com") {
    const today = getTodayString();
    const counter = dailyCounters.get(userId);
    if (!counter || counter.date !== today) {
        // Reset counter for new day
        dailyCounters.set(userId, { count: 0, date: today });
        return 0;
    }
    return counter.count;
}
function incrementDailyCountInternal(userId = "bizmowa.com") {
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
    console.log(`✅ Problem count: ${counter.count}/${DAILY_LIMIT} for ${userId}`);
    return true;
}
function resetDailyCount(userId = "bizmowa.com") {
    console.log("🔄 Resetting daily count for user:", userId);
    dailyCounters.delete(userId);
}
export class Storage {
    // Training sessions
    async getTrainingSessions(userId) {
        return await db
            .select()
            .from(trainingSessions)
            .orderBy(desc(trainingSessions.createdAt));
    }
    async getTrainingSession(id) {
        const result = await db
            .select()
            .from(trainingSessions)
            .where(eq(trainingSessions.id, parseInt(id)))
            .limit(1);
        return result[0] || null;
    }
    async createTrainingSession(data) {
        const result = await db
            .insert(trainingSessions)
            .values(data)
            .returning();
        return result[0];
    }
    async updateTrainingSession(id, data) {
        const result = await db
            .update(trainingSessions)
            .set(data)
            .where(eq(trainingSessions.id, parseInt(id)))
            .returning();
        return result[0];
    }
    async deleteTrainingSession(id) {
        await db
            .delete(trainingSessions)
            .where(eq(trainingSessions.id, parseInt(id)));
    }
    // Low-rated and review sessions
    async getLowRatedSessions(userId) {
        return await db
            .select()
            .from(trainingSessions)
            .orderBy(desc(trainingSessions.createdAt))
            .limit(50);
    }
    async getBookmarkedSessions(userId) {
        return await db
            .select()
            .from(trainingSessions)
            .orderBy(desc(trainingSessions.createdAt))
            .limit(50);
    }
    async updateReviewCount(sessionId) {
        // This is a placeholder for review count tracking
        // Implementation depends on specific requirements
    }
    async updateProblemProgress(userId, progress) {
        // This is a placeholder for problem progress tracking
        // Implementation depends on specific requirements
    }
    // CRITICAL: Daily limit functions
    async incrementDailyCount(userId = "bizmowa.com") {
        return incrementDailyCountInternal(userId);
    }
    async getDailyCount(userId = "bizmowa.com") {
        return getDailyCount(userId);
    }
    // Reset daily count for testing
    async resetDailyCount(userId = "bizmowa.com") {
        resetDailyCount(userId);
    }
    // Goals and progress
    async getUserGoals(userId) {
        return await db
            .select()
            .from(userGoals)
            .orderBy(desc(userGoals.createdAt));
    }
    async updateUserGoal(userId, data) {
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
        }
        else {
            const result = await db
                .insert(userGoals)
                .values(data)
                .returning();
            return result[0];
        }
    }
    async getDailyProgress(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return await db
            .select()
            .from(dailyProgress)
            .where(gte(dailyProgress.date, thirtyDaysAgo.toISOString().split('T')[0]))
            .orderBy(desc(dailyProgress.date));
    }
    async updateDailyProgress(userId, data) {
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
        }
        else {
            const result = await db
                .insert(dailyProgress)
                .values({ ...data, date: today })
                .returning();
            return result[0];
        }
    }
    // Custom scenarios
    async getCustomScenarios(userId) {
        return await db
            .select()
            .from(customScenarios)
            .orderBy(desc(customScenarios.createdAt));
    }
    async getCustomScenario(id) {
        const result = await db
            .select()
            .from(customScenarios)
            .where(eq(customScenarios.id, parseInt(id)))
            .limit(1);
        return result[0] || null;
    }
    async createCustomScenario(data) {
        const result = await db
            .insert(customScenarios)
            .values(data)
            .returning();
        return result[0];
    }
    async updateCustomScenario(id, data) {
        const result = await db
            .update(customScenarios)
            .set(data)
            .where(eq(customScenarios.id, parseInt(id)))
            .returning();
        return result[0];
    }
    async deleteCustomScenario(id) {
        await db
            .delete(customScenarios)
            .where(eq(customScenarios.id, parseInt(id)));
    }
}
export const storage = new Storage();
