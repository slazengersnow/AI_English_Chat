import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (typeof window !== "undefined") {
  (window as any).SUPA_DEBUG = { url, anonHead: anon?.slice(0, 12) };
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // /auth-callback で明示処理する
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    flowType: 'pkce',
  },
});