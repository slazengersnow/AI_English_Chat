// server/routes/admin.ts
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
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
            const url = process.env.SUPABASE_URL;
            const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!url || !serviceRole) {
                return res.status(500).json({ error: "Supabase env not set" });
            }
            const supa = createClient(url, serviceRole);
            const result = await supa.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (result.error) {
                return res.status(400).json({ error: result.error.message });
            }
            return res.status(201).json({ user: result.data.user });
        }
        catch (e) {
            console.error("admin create-user error:", e);
            return res.status(500).json({ error: e?.message ?? "unknown error" });
        }
    });
    // ここが肝：/api/admin にぶら下げる
    app.use("/api/admin", router);
}
