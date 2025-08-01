// server/routes/index.ts
import { Router, Express } from "express";
import chatRoutes from "./chat";
import userRoutes from "./user";
import { testAuth, getSupabaseStatus } from './debug-auth';
import { registerRoutes as registerMainRoutes } from "../routes";

// ⚠️ 👇 これは削除（index.tsでは登録しない）
/* import stripeWebhookRoutes from "./stripe-webhook.js"; */

export function registerRoutes(app: Express) {
  const router = Router();

  router.use("/chat", chatRoutes);
  router.use("/user", userRoutes);
  
  // Debug auth routes
  router.post("/test-auth", testAuth);
  router.get("/supabase-status", getSupabaseStatus);
  
  app.use("/api", router);
  
  // Register main routes including problem generation
  registerMainRoutes(app);
}
