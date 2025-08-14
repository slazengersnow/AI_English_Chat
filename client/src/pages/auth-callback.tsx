import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("認証処理中…");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const type = params.get("type"); // signup / magiclink 等

        // detectSessionInUrl=false のため手動交換
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          console.log("[auth-callback] exchange success", {
            type,
            user: data.user?.id,
          });
          window.location.replace("/subscription-select");
          return;
        }

        // codeがない場合は既にセッション化していないか最終確認
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace("/subscription-select");
          return;
        }

        setMsg(
          "認証リンクが無効または期限切れです。もう一度ログイン/新規登録をお試しください。",
        );
      } catch (e: any) {
        console.error("[auth-callback] error", e);
        setMsg(`認証処理に失敗しました: ${e?.message || e}`);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <h1>Email Verification</h1>
      <p>{msg}</p>
    </div>
  );
}
