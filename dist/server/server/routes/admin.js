import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
const admin = Router();
admin.post('/admin/create-user', async (req, res) => {
    try {
        const { email, password } = req.body ?? {};
        const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await supa.auth.admin.createUser({
            email, password, email_confirm: true
        });
        if (error)
            return res.status(400).json({ error });
        res.json({ data });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default admin;
