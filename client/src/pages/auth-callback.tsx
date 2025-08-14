import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("認証処理中…");

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        window.location.replace("/subscription-select");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace("/subscription-select");
        return;
      }
      setMsg("認証リンクが無効または期限切れです。もう一度お試しください。");
    })();
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <h1>Email Verification</h1>
      <p>{msg}</p>
    </div>
  );
}
