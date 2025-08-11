import { Router } from 'express';
const r = Router();
r.post('/create-user', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error:'missing' });

    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resp = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'apikey': key
      },
      body: JSON.stringify({ email, password })
    });
    const json = await resp.json();
    return res.status(resp.status).json(json);
  } catch (e:any) {
    return res.status(500).json({ error: e?.message });
  }
});
export default r;