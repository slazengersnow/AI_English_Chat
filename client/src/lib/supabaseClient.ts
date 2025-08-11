import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ★ デバッグ出力（キーは先頭6文字だけ）
console.log('[Supabase] VITE_SUPABASE_URL =', supabaseUrl);
console.log('[Supabase] VITE_SUPABASE_ANON_KEY(head) =', supabaseAnonKey?.slice(0, 6));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing VITE_ env. Check client build-time env injection.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// デバッグ用（F12 から window.supabase で触れる）
if (typeof window !== "undefined") (window as any).supabase = supabase;