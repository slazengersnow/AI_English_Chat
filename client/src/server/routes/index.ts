import { Express } from "express";
import chatRoutes from "./chat";
import stripeWebhookRoutes from "./stripe-webhook";
import userRoutes from "./user";

export async function registerRoutes(app: Express) {
  app.use("/api/chat", chatRoutes);
  app.use("/api/webhook", stripeWebhookRoutes);
  app.use("/api/user", userRoutes);
}
