import type { Express } from "express";
import { storage } from "./storage.js";

export function registerAdminRoutes(app: Express) {
  // Usage Statistics
  app.get("/api/admin/usage-stats", async (req, res) => {
    try {
      // Mock data for now - replace with actual database queries
      const usageStats = {
        todayUsers: Math.floor(Math.random() * 150) + 50,
        todayProblems: Math.floor(Math.random() * 500) + 200,
        categoryStats: {
          "TOEIC": Math.floor(Math.random() * 100) + 50,
          "中学英語": Math.floor(Math.random() * 80) + 40,
          "高校英語": Math.floor(Math.random() * 60) + 30,
          "基本動詞": Math.floor(Math.random() * 40) + 20,
          "ビジネスメール": Math.floor(Math.random() * 70) + 35,
          "シミュレーション練習": Math.floor(Math.random() * 30) + 15
        },
        realtimeConnections: Math.floor(Math.random() * 25) + 5
      };

      res.json(usageStats);
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      res.status(500).json({ error: "Failed to get usage statistics" });
    }
  });

  // Subscription Information  
  app.get("/api/admin/subscription-info", async (req, res) => {
    try {
      // Mock data for now - replace with actual Stripe API calls
      const subscriptionInfo = {
        activeSubscribers: Math.floor(Math.random() * 50) + 20,
        trialUsers: Math.floor(Math.random() * 30) + 10,
        monthlyRevenue: Math.floor(Math.random() * 100000) + 50000
      };

      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Failed to get subscription info:", error);
      res.status(500).json({ error: "Failed to get subscription information" });
    }
  });

  // Users List
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Mock data for now - replace with actual database queries
      const users = [];
      for (let i = 0; i < 25; i++) {
        users.push({
          id: `user_${i + 1}`,
          email: `user${i + 1}@example.com`,
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: ['active', 'trial', 'inactive'][Math.floor(Math.random() * 3)],
          lastActive: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null
        });
      }

      res.json(users);
    } catch (error) {
      console.error("Failed to get users:", error);
      res.status(500).json({ error: "Failed to get users list" });
    }
  });

  // System Status
  app.get("/api/admin/system-status", async (req, res) => {
    try {
      // Check system health
      const status = {
        claudeApi: 'healthy',
        stripeApi: 'healthy',
        database: 'healthy',
        lastUpdated: new Date().toLocaleString('ja-JP')
      };

      // Check Claude API
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          status.claudeApi = 'down';
        }
      } catch {
        status.claudeApi = 'degraded';
      }

      // Check Stripe API
      try {
        if (!process.env.STRIPE_SECRET_KEY) {
          status.stripeApi = 'down';
        }
      } catch {
        status.stripeApi = 'degraded';
      }

      res.json(status);
    } catch (error) {
      console.error("Failed to get system status:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Send Notification
  app.post("/api/admin/send-notification", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Log the notification (in a real app, you'd store this in DB and push to users)
      console.log(`📢 Admin Notification: ${message}`);
      
      // TODO: Implement actual notification system (WebSocket, email, push notifications)
      
      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Failed to send notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // User Statistics
  app.get("/api/user/stats", async (req, res) => {
    try {
      // Mock user statistics - replace with actual database queries
      const stats = {
        totalProblems: Math.floor(Math.random() * 500) + 100,
        averageRating: Math.random() * 2 + 3, // 3-5 range
        streakDays: Math.floor(Math.random() * 30) + 1,
        favoriteCategory: ["TOEIC", "中学英語", "高校英語"][Math.floor(Math.random() * 3)],
        monthlyProgress: Math.floor(Math.random() * 80) + 20, // 20-100%
        dailyGoal: 30,
        weeklyStats: [
          { day: "月", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "火", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "水", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "木", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "金", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "土", problems: Math.floor(Math.random() * 40) + 10 },
          { day: "日", problems: Math.floor(Math.random() * 40) + 10 }
        ]
      };

      res.json(stats);
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ error: "Failed to get user statistics" });
    }
  });

  // User Bookmarks
  app.get("/api/user/bookmarks", async (req, res) => {
    try {
      // Mock bookmarked problems - replace with actual database queries
      const bookmarks = [];
      for (let i = 0; i < Math.floor(Math.random() * 10) + 3; i++) {
        bookmarks.push({
          id: `bookmark_${i + 1}`,
          japaneseSentence: "このプロジェクトの進捗を報告してください。",
          userTranslation: "Please report this project progress.",
          correctTranslation: "Please report the progress of this project.",
          rating: Math.floor(Math.random() * 3) + 3,
          category: ["TOEIC", "ビジネスメール"][Math.floor(Math.random() * 2)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      res.json(bookmarks);
    } catch (error) {
      console.error("Failed to get bookmarks:", error);
      res.status(500).json({ error: "Failed to get bookmarks" });
    }
  });

  // Export User Data
  app.get("/api/user/export-data", async (req, res) => {
    try {
      // Mock user export data - replace with actual database queries
      const exportData = {
        user: {
          exportDate: new Date().toISOString(),
          totalProblems: Math.floor(Math.random() * 500) + 100
        },
        statistics: {
          averageRating: Math.random() * 2 + 3,
          streakDays: Math.floor(Math.random() * 30) + 1,
          categoryStats: {
            "TOEIC": Math.floor(Math.random() * 100),
            "中学英語": Math.floor(Math.random() * 80),
            "高校英語": Math.floor(Math.random() * 60)
          }
        },
        sessions: [],
        bookmarks: []
      };

      res.json(exportData);
    } catch (error) {
      console.error("Failed to export data:", error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });

  // User Subscription Status
  app.get("/api/user/subscription", async (req, res) => {
    try {
      // Mock subscription status - replace with actual Stripe API calls
      const subscription = {
        status: ['trial', 'active', 'inactive'][Math.floor(Math.random() * 3)],
        plan: 'standard',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(subscription);
    } catch (error) {
      console.error("Failed to get subscription:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Remove Bookmark
  app.delete("/api/user/bookmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock bookmark removal - replace with actual database operations
      console.log(`Removing bookmark: ${id}`);
      
      res.json({ success: true, message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      res.status(500).json({ error: "Failed to remove bookmark" });
    }
  });
}