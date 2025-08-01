// server/routes/index.ts
import { Router } from "express";
import chatRoutes from "./chat";
import userRoutes from "./user";
import { testAuth, getSupabaseStatus } from './debug-auth';
// ⚠️ 👇 これは削除（index.tsでは登録しない）
/* import stripeWebhookRoutes from "./stripe-webhook.js"; */
export function registerRoutes(app) {
    const router = Router();
    router.use("/chat", chatRoutes);
    router.use("/user", userRoutes);
    // Debug auth routes
    router.post("/test-auth", testAuth);
    router.get("/supabase-status", getSupabaseStatus);
    // router.use("/webhook", stripeWebhookRoutes); // 👈 削除
    app.use("/api", router);
}
