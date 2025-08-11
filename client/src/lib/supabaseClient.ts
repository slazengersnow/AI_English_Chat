import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
console.log('[Supabase] VITE_SUPABASE_URL =', url);

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// Debug window
(window as any).SUPA_DEBUG = { url, anonHead: anon?.slice(0,10) };