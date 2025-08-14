import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("認証処理中...");

  useEffect(() => {
    (async () => {
      try {
        const p = new URLSearchParams(window.location.search);
        const code = p.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace("/subscription-select");
          return;
        }
        setMsg("認証リンクが無効または期限切れです。もう一度お試しください。");
      } catch (e: any) {
        setMsg(`認証エラー: ${e.message || e}`);
      }
    })();
  }, []);

  return <div style={{padding:24}}>{msg}</div>;
}