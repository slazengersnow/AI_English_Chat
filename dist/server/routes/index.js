// server/routes/index.ts
import { Router } from "express";
import chatRoutes from "./chat.js";
import userRoutes from "./user.js";
import { testAuth, getSupabaseStatus } from './debug-auth.js';
export function registerRoutes(app) {
    const router = Router();
    router.use("/chat", chatRoutes);
    router.use("/user", userRoutes);
    // Debug auth routes
    router.post("/test-auth", testAuth);
    router.get("/supabase-status", getSupabaseStatus);
    app.use("/api", router);
}
