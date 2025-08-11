import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const admin = Router();

admin.post('/admin/create-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const url = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return res.status(500).json({ error: 'Service role key not configured' });
    }
    
    const supaAdmin = createClient(url, serviceKey);
    const { data, error } = await supaAdmin.auth.admin.createUser({
      email, 
      password, 
      email_confirm: true
    });
    
    if (error) return res.status(400).json({ error });
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default admin;