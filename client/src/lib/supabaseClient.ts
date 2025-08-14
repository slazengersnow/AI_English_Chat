// client/src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// デバッグ（/signup-simple で window.SUPA_DEBUG を見れるように）
if (typeof window !== "undefined") {
  (window as any).SUPA_DEBUG = { url, anonHead: anon?.slice(0, 12) };
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,          // ローカルにセッション保存
    autoRefreshToken: true,        // 自動リフレッシュ
    detectSessionInUrl: false,     // Vite環境での不要なURL解析を無効化
    storage: window.localStorage,  // Replitプレビューでも確実に保存
  },
});