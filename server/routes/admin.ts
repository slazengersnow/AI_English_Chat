// server/routes/admin.ts
import { Router, type Express, type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "../supabase-admin.js";
import { getStorage } from "../storage.js";
import { eq, desc, sql, count } from "drizzle-orm";
import { userSubscriptions, trainingSessions, dailyProgress, customScenarios } from "../../shared/schema.js";
import Stripe from "stripe";

// Initialize Stripe if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
}

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
      
      // Get additional detailed statistics
      const weeklyActiveUsersResult = await storage.db
        .selectDistinct({ userId: trainingSessions.userId })
        .from(trainingSessions)
        .where(sql`${trainingSessions.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`);
      const weeklyActiveUsers = weeklyActiveUsersResult.length;
      
      // Get subscription breakdown
      const standardSubscriptions = await storage.db
        .select({ count: count() })
        .from(userSubscriptions)
        .where(sql`${userSubscriptions.subscriptionType} = 'standard' AND ${userSubscriptions.subscriptionStatus} = 'active'`);
      const premiumSubscriptions = await storage.db
        .select({ count: count() })
        .from(userSubscriptions)
        .where(sql`${userSubscriptions.subscriptionType} = 'premium' AND ${userSubscriptions.subscriptionStatus} = 'active'`);
      
      const standardCount = standardSubscriptions[0]?.count || 0;
      const premiumCount = premiumSubscriptions[0]?.count || 0;
      
      // Calculate revenue based on actual subscription types
      const totalRevenue = (standardCount * 980) + (premiumCount * 1300);
      
      res.json({
        totalUsers,
        totalSessions,
        totalRevenue,
        activeSubscriptions,
        monthlyActiveUsers,
        weeklyActiveUsers,
        standardSubscriptions: standardCount,
        premiumSubscriptions: premiumCount,
        averageSessionsPerUser: totalUsers > 0 ? Math.round(totalSessions / totalUsers) : 0,
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
      const subscriptions = await storage.db
        .select({
          id: userSubscriptions.userId,
          subscriptionType: userSubscriptions.subscriptionType,
          subscriptionStatus: userSubscriptions.subscriptionStatus,
          isAdmin: userSubscriptions.isAdmin,
          createdAt: userSubscriptions.createdAt,
          updatedAt: userSubscriptions.updatedAt,
        })
        .from(userSubscriptions)
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(100);
      
      // Get actual user emails from Supabase
      const usersWithEmails = await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            // Get user info from Supabase Auth
            const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(subscription.id);
            
            return {
              id: subscription.id,
              email: user?.email || '不明',
              subscriptionType: subscription.subscriptionType,
              subscriptionStatus: subscription.subscriptionStatus,
              isAdmin: subscription.isAdmin,
              createdAt: subscription.createdAt,
              lastActive: subscription.updatedAt.toISOString().split('T')[0],
            };
          } catch (error) {
            console.error(`Error fetching user ${subscription.id}:`, error);
            return {
              id: subscription.id,
              email: 'エラー',
              subscriptionType: subscription.subscriptionType,
              subscriptionStatus: subscription.subscriptionStatus,
              isAdmin: subscription.isAdmin,
              createdAt: subscription.createdAt,
              lastActive: subscription.updatedAt.toISOString().split('T')[0],
            };
          }
        })
      );
      
      res.json(usersWithEmails);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin Analytics API
  router.get("/analytics", async (req, res) => {
    try {
      const storage = getStorage();
      
      // Category name mapping to Japanese
      const categoryNameMap: Record<string, string> = {
        'toeic': 'TOEIC',
        'middle_school': '中学英語',
        'middle-school': '中学英語',
        'high_school': '高校英語', 
        'high-school': '高校英語',
        'basic_verbs': '基本動詞',
        'basic-verbs': '基本動詞',
        'business_email': 'ビジネスメール',
        'business-email': 'ビジネスメール',
        'simulation': 'シミュレーション練習',
      };
      
      // Get total learning stats
      const totalSessionsResult = await storage.db.select({ count: count() }).from(trainingSessions);
      const totalLearningCount = totalSessionsResult[0]?.count || 0;
      
      // Calculate learning time based on actual session data characteristics
      // Get detailed session data to calculate realistic learning times
      const sessionDetails = await storage.db
        .select({
          difficultyLevel: trainingSessions.difficultyLevel,
          japaneseSentence: trainingSessions.japaneseSentence,
          userTranslation: trainingSessions.userTranslation,
          rating: trainingSessions.rating,
        })
        .from(trainingSessions);
      
      // Calculate dynamic learning time based on real session characteristics
      const totalLearningTime = sessionDetails.reduce((total, session) => {
        // Base time calculation factors:
        // 1. Japanese sentence length (more characters = more time to read/understand)
        const japaneseLength = session.japaneseSentence.length;
        const baseLengthTime = Math.max(0.5, japaneseLength / 20); // ~1 minute per 20 characters
        
        // 2. Translation complexity (longer translations = more thinking time)
        const translationLength = session.userTranslation.length;
        const translationTime = Math.max(0.3, translationLength / 30); // ~1 minute per 30 characters
        
        // 3. Difficulty multiplier based on category
        const difficultyMultiplier = (() => {
          switch (session.difficultyLevel) {
            case 'basic-verbs': return 0.8;
            case 'middle-school': return 1.0;
            case 'high-school': return 1.3;
            case 'toeic': return 1.5;
            case 'business-email': return 1.8;
            case 'simulation': return 2.0;
            default: return 1.2;
          }
        })();
        
        // 4. Rating factor (lower ratings suggest more time spent struggling)
        const ratingFactor = session.rating <= 2 ? 1.5 : session.rating <= 3 ? 1.2 : 1.0;
        
        // Calculate final time: base reading time + translation time, adjusted by difficulty and rating
        const sessionTime = (baseLengthTime + translationTime) * difficultyMultiplier * ratingFactor;
        
        // Cap minimum at 1 minute, maximum at 15 minutes per session
        return total + Math.min(15, Math.max(1, sessionTime));
      }, 0);
      
      // Get category statistics
      const categoryStats = await storage.db
        .select({
          category: trainingSessions.difficultyLevel,
          totalAttempts: count(),
          averageRating: sql<number>`ROUND(AVG(${trainingSessions.rating}), 1)`,
        })
        .from(trainingSessions)
        .groupBy(trainingSessions.difficultyLevel);
      
      // Calculate correct rate based on actual ratings (rating >= 4 is considered "correct")
      // Group by mapped category names to avoid duplicates
      const categoryStatsGrouped = new Map<string, { totalAttempts: number; totalRating: number; count: number }>();
      
      categoryStats.forEach(stat => {
        const mappedCategory = categoryNameMap[stat.category] || stat.category;
        const existing = categoryStatsGrouped.get(mappedCategory);
        
        if (existing) {
          existing.totalAttempts += stat.totalAttempts;
          existing.totalRating += stat.averageRating * stat.totalAttempts;
          existing.count += stat.totalAttempts;
        } else {
          categoryStatsGrouped.set(mappedCategory, {
            totalAttempts: stat.totalAttempts,
            totalRating: stat.averageRating * stat.totalAttempts,
            count: stat.totalAttempts,
          });
        }
      });
      
      const categoryStatsWithCorrectRate = Array.from(categoryStatsGrouped.entries()).map(([category, data]) => ({
        category,
        totalAttempts: data.totalAttempts,
        correctRate: Math.round((data.totalRating / data.count / 5) * 100),
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
        totalLearningTime: Math.round(totalLearningTime),
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

  // Stripe Payment Analytics API
  router.get("/payments", async (req, res) => {
    try {
      if (!stripe) {
        return res.json({
          stripeConnected: false,
          totalRevenue: 0,
          monthlyRecurringRevenue: 0,
          totalTransactions: 0,
          recentPayments: [],
          error: "Stripe not configured",
        });
      }

      // Get payment data from Stripe
      const [charges, subscriptions] = await Promise.all([
        stripe.charges.list({ limit: 100 }),
        stripe.subscriptions.list({ limit: 100, status: 'active' }),
      ]);

      // Calculate total revenue from charges
      const totalRevenue = charges.data.reduce((sum, charge) => {
        return sum + (charge.amount_captured || 0);
      }, 0) / 100; // Convert from cents

      // Calculate MRR from active subscriptions
      const monthlyRecurringRevenue = subscriptions.data.reduce((sum, sub) => {
        if (sub.items.data[0]?.price) {
          const price = sub.items.data[0].price;
          const amount = price.unit_amount || 0;
          // Convert to monthly amount based on interval
          const monthlyAmount = price.recurring?.interval === 'year' 
            ? amount / 12 
            : amount;
          return sum + monthlyAmount;
        }
        return sum;
      }, 0) / 100; // Convert from cents

      // Get recent payments
      const recentPayments = charges.data.slice(0, 10).map(charge => ({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        created: new Date(charge.created * 1000).toISOString(),
        description: charge.description || 'サブスクリプション決済',
        customerEmail: charge.billing_details?.email || 'N/A',
      }));

      res.json({
        stripeConnected: true,
        totalRevenue,
        monthlyRecurringRevenue,
        totalTransactions: charges.data.length,
        activeSubscriptions: subscriptions.data.length,
        recentPayments,
      });
    } catch (error) {
      console.error('Stripe payments error:', error);
      res.json({
        stripeConnected: false,
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        totalTransactions: 0,
        recentPayments: [],
        error: 'Failed to fetch payment data from Stripe',
      });
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
