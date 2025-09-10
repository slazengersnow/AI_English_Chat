// server/routes/admin.ts
import { Router, type Express, type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "../supabase-admin.js";
import { getStorage } from "../storage.js";
import { eq, desc, sql, count } from "drizzle-orm";
import { userSubscriptions, trainingSessions, dailyProgress, customScenarios } from "../../shared/schema.js";

// Admin authorization middleware
async function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check admin status in database
    const storage = getStorage();
    const adminCheck = await storage.db
      .select({ isAdmin: userSubscriptions.isAdmin })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, user.id))
      .limit(1);

    if (adminCheck.length === 0 || !adminCheck[0].isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Add user info to request for use in route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ error: 'Internal server error during authorization' });
  }
}

export function registerAdminRoutes(app: Express) {
  const router = Router();
  
  // Apply admin authentication middleware to all admin routes
  router.use(verifyAdmin);

  // Admin Stats API
  router.get("/stats", async (req, res) => {
    try {
      const storage = getStorage();
      
      // Get total users from userSubscriptions table
      const totalUsersResult = await storage.db.select({ count: count() }).from(userSubscriptions);
      const totalUsers = totalUsersResult[0]?.count || 0;
      
      // Get total sessions
      const totalSessionsResult = await storage.db.select({ count: count() }).from(trainingSessions);
      const totalSessions = totalSessionsResult[0]?.count || 0;
      
      // Get active subscriptions
      const activeSubscriptionsResult = await storage.db
        .select({ count: count() })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.subscriptionStatus, 'active'));
      const activeSubscriptions = activeSubscriptionsResult[0]?.count || 0;
      
      // Calculate monthly active users (users who created sessions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyActiveUsersResult = await storage.db
        .selectDistinct({ userId: trainingSessions.userId })
        .from(trainingSessions)
        .where(sql`${trainingSessions.createdAt} >= ${thirtyDaysAgo}`);
      const monthlyActiveUsers = monthlyActiveUsersResult.length;
      
      res.json({
        totalUsers,
        totalSessions,
        totalRevenue: activeSubscriptions * 980, // Mock calculation: active subs * standard price
        activeSubscriptions,
        monthlyActiveUsers,
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  // Admin Users API
  router.get("/users", async (req, res) => {
    try {
      const storage = getStorage();
      
      // Get all users with their subscription info
      const users = await storage.db
        .select({
          id: userSubscriptions.userId,
          email: sql<string>`'user' || substr(${userSubscriptions.userId}, 1, 8) || '@example.com'`, // Mock email format
          subscriptionType: userSubscriptions.subscriptionType,
          subscriptionStatus: userSubscriptions.subscriptionStatus,
          isAdmin: userSubscriptions.isAdmin,
          createdAt: userSubscriptions.createdAt,
          lastActive: sql<string>`to_char(${userSubscriptions.updatedAt}, 'YYYY-MM-DD')`,
        })
        .from(userSubscriptions)
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(100);
      
      res.json(users);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin Analytics API
  router.get("/analytics", async (req, res) => {
    try {
      const storage = getStorage();
      
      // Get total learning stats
      const totalSessionsResult = await storage.db.select({ count: count() }).from(trainingSessions);
      const totalLearningCount = totalSessionsResult[0]?.count || 0;
      
      // Mock total learning time (assume 2 minutes per session)
      const totalLearningTime = totalLearningCount * 2;
      
      // Get category statistics
      const categoryStats = await storage.db
        .select({
          category: trainingSessions.difficultyLevel,
          totalAttempts: count(),
          averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
        })
        .from(trainingSessions)
        .groupBy(trainingSessions.difficultyLevel);
      
      // Calculate correct rate (mock: assume rating >= 4 is "correct")
      const categoryStatsWithCorrectRate = categoryStats.map(stat => ({
        category: stat.category,
        totalAttempts: stat.totalAttempts,
        correctRate: Math.round((stat.averageRating / 5) * 100), // Convert rating to percentage
      }));
      
      // Get monthly stats (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyStats = await storage.db
        .select({
          month: sql<string>`to_char(${trainingSessions.createdAt}, 'YYYY-MM')`,
          sessions: count(),
          averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
        })
        .from(trainingSessions)
        .where(sql`${trainingSessions.createdAt} >= ${sixMonthsAgo}`)
        .groupBy(sql`to_char(${trainingSessions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${trainingSessions.createdAt}, 'YYYY-MM')`);
      
      res.json({
        totalLearningTime,
        totalLearningCount,
        categoryStats: categoryStatsWithCorrectRate,
        monthlyStats,
      });
    } catch (error) {
      console.error('Admin analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Data Export API
  router.get("/export/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const storage = getStorage();
      
      if (type === 'users') {
        const users = await storage.db
          .select({
            userId: userSubscriptions.userId,
            subscriptionType: userSubscriptions.subscriptionType,
            subscriptionStatus: userSubscriptions.subscriptionStatus,
            isAdmin: userSubscriptions.isAdmin,
            createdAt: userSubscriptions.createdAt,
            updatedAt: userSubscriptions.updatedAt,
          })
          .from(userSubscriptions);
        
        // Convert to CSV format
        const csvHeaders = 'User ID,Subscription Type,Status,Is Admin,Created At,Updated At\n';
        const csvData = users.map(user => 
          `${user.userId},${user.subscriptionType},${user.subscriptionStatus},${user.isAdmin},${user.createdAt},${user.updatedAt}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeaders + csvData);
        
      } else if (type === 'sessions') {
        const sessions = await storage.db
          .select({
            id: trainingSessions.id,
            userId: trainingSessions.userId,
            difficultyLevel: trainingSessions.difficultyLevel,
            japaneseSentence: trainingSessions.japaneseSentence,
            userTranslation: trainingSessions.userTranslation,
            rating: trainingSessions.rating,
            isBookmarked: trainingSessions.isBookmarked,
            createdAt: trainingSessions.createdAt,
          })
          .from(trainingSessions)
          .orderBy(desc(trainingSessions.createdAt))
          .limit(1000);
        
        // Convert to CSV format
        const csvHeaders = 'ID,User ID,Difficulty Level,Japanese Sentence,User Translation,Rating,Bookmarked,Created At\n';
        const csvData = sessions.map(session => 
          `${session.id},${session.userId},${session.difficultyLevel},"${session.japaneseSentence}","${session.userTranslation}",${session.rating},${session.isBookmarked},${session.createdAt}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sessions-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeaders + csvData);
        
      } else {
        res.status(400).json({ error: 'Invalid export type' });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  // Update User Subscription
  router.put("/users/:userId/subscription", async (req, res) => {
    try {
      const { userId } = req.params;
      const { subscriptionType } = req.body;
      
      if (!subscriptionType || !['standard', 'premium'].includes(subscriptionType)) {
        return res.status(400).json({ error: 'Invalid subscription type' });
      }
      
      const storage = getStorage();
      
      // Update the user's subscription
      await storage.db
        .update(userSubscriptions)
        .set({ 
          subscriptionType,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));
      
      res.json({ success: true, message: 'Subscription updated successfully' });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  router.post("/create-user", async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "email and password are required" });
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        // 既存ユーザー時の統一メッセージ
        if (String(error.message).toLowerCase().includes("already")) {
          return res.status(400).json({ error: "A user with this email address has already been registered" });
        }
        return res.status(400).json({ error: error.message });
      }
      return res.status(201).json(data);
    } catch (e: any) {
      console.error("admin create-user error:", e);
      return res.status(500).json({ error: e?.message ?? "unknown error" });
    }
  });

  // ここが肝：/api/admin にぶら下げる
  app.use("/api/admin", router);
}
