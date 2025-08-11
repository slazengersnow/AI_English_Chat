import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 起動時に必ず見えるログ（マスク付き）
console.log("[Supabase] init", {
  hasUrl: !!url,
  hasAnon: !!anon,
  urlHost: url ? new URL(url).host : null,
});

if (!url || !anon) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url!, anon!, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// デバッグ用（F12 から window.supabase で触れる）
if (typeof window !== "undefined") (window as any).supabase = supabase;