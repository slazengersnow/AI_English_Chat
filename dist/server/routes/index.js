// server/routes/index.ts
import { Router } from "express";
import chatRoutes from "./chat.js";
import userRoutes from "./user.js";
import { testAuth, getSupabaseStatus } from './debug-auth.js';
// Import main routes from routes.ts
import mainRouter from "../routes.js";
export function registerRoutes(app) {
    const router = Router();
    router.use("/chat", chatRoutes);
    router.use("/user", userRoutes);
    // Debug auth routes
    router.post("/test-auth", testAuth);
    router.get("/supabase-status", getSupabaseStatus);
    // Main API routes (problem generation, evaluation, etc.)
    router.use(mainRouter);
    app.use("/api", router);
}
