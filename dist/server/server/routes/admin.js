import { Router } from 'express';
const router = Router();
router.post('/create-user', async (req, res) => {
    try {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key)
            return res.status(500).json({ message: 'service role not set' });
        const r = await fetch(`${url}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'apikey': key,
            },
            body: JSON.stringify(req.body),
        });
        const j = await r.json();
        res.status(r.status).json(j);
    }
    catch (e) {
        res.status(500).json({ message: e?.message || String(e) });
    }
});
export default router;
