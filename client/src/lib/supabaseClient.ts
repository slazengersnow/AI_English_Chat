import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] VITE_SUPABASE_URL =', url);
console.log('[Supabase] VITE_SUPABASE_ANON_KEY(head) =', anon?.slice(0, 6));

if (!url || !anon) {
  throw new Error('[Supabase] VITE_ 環境変数が不足しています');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// デバッグ用（F12 から window.supabase で触れる）
if (typeof window !== "undefined") (window as any).supabase = supabase;