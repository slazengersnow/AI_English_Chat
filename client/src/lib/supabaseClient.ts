// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 画面上とConsoleに強制表示
// @ts-expect-error
window.__SUPA_DEBUG__ = { url, anonHead: anon?.slice(0, 12) };
console.log('[Supabase] VITE_SUPABASE_URL =', url);
console.log('[Supabase] VITE_SUPABASE_ANON_KEY(head) =', anon?.slice(0, 12));

if (!url || !anon) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未定義です');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});