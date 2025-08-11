// client/src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // ここで気付けるように明示ログ
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY", {
    hasUrl: !!url,
    hasAnon: !!anon,
    url: url?.substring(0, 30) + "...",
    anon: anon?.substring(0, 20) + "...",
  });
}

export const supabase = createClient(url!, anon!, {
  auth: {
    persistSession: true, // ローカル保持
    autoRefreshToken: true,
  },
});

console.log("[Supabase] Client initialized", {
  hasUrl: !!url,
  hasAnon: !!anon,
  url: url?.substring(0, 30) + "...",
});