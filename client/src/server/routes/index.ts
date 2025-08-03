import { Express } from "express";
import chatRoutes from "./chat.js";
import stripeWebhookRoutes from "./stripe-webhook.js";
import userRoutes from "./user.js";

export async function registerRoutes(app: Express) {
  app.use("/api/chat", chatRoutes);
  app.use("/api/webhook", stripeWebhookRoutes);
  app.use("/api/user", userRoutes);
}
