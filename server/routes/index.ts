// server/routes/index.ts
import { Router, Express } from "express"; // ← ここで Express をインポート
import chatRoutes from "./chat.js";
import userRoutes from "./user.js";
import stripeWebhookRoutes from "./stripe-webhook.js";

export function registerRoutes(app: Express) {
  // ← 型を明示
  const router = Router();

  router.use("/chat", chatRoutes);
  router.use("/user", userRoutes);
  router.use("/webhook", stripeWebhookRoutes);

  app.use("/api", router);
}
