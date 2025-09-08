// server/routes/admin.ts
import { Router } from "express";
import { supabaseAdmin } from "../supabase-admin.js";
export function registerAdminRoutes(app) {
    const router = Router();
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
        }
        catch (e) {
            console.error("admin create-user error:", e);
            return res.status(500).json({ error: e?.message ?? "unknown error" });
        }
    });
    // ここが肝：/api/admin にぶら下げる
    app.use("/api/admin", router);
}
