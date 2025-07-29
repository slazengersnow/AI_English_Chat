// server/routes/index.ts
import { Router, Express } from "express";
import chatRoutes from "./chat";
import userRoutes from "./user";

// ⚠️ 👇 これは削除（index.tsでは登録しない）
/* import stripeWebhookRoutes from "./stripe-webhook.js"; */

export function registerRoutes(app: Express) {
  const router = Router();

  router.use("/chat", chatRoutes);
  router.use("/user", userRoutes);
  // router.use("/webhook", stripeWebhookRoutes); // 👈 削除

  app.use("/api", router);
}
