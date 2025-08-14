import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SignupSimple() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);

    try {
      console.log("[SignupSimple] payload email =", email);
      const redirectTo = `${window.location.origin}/auth-callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        // 既存アドレスなどのユーザ向けメッセージ
        if (error.message?.toLowerCase().includes("already")) {
          setErr(
            "このメールアドレスは既に登録されています。ログインをご利用ください。",
          );
        } else {
          setErr(`サインアップに失敗しました: ${error.message}`);
        }
        return;
      }

      // メール確認ON時: セッションはまだない → まずは案内
      if (!data.session) {
        setMsg(
          "確認メールを送信しました。メール内のリンクから認証を完了してください。",
        );
        return;
      }

      // メール確認OFF時: その場でログイン済み → プラン選択へ
      window.location.assign("/subscription-select");
    } catch (e: any) {
      setErr(`想定外のエラー: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <h1>Signup Simple (Debug)</h1>
      <p>VITE_SUPABASE_URL: {(window as any).SUPA_DEBUG?.url}</p>
      <p>
        VITE_SUPABASE_ANON_KEY(head): {(window as any).SUPA_DEBUG?.anonHead}
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <button
          disabled={loading}
          type="submit"
          style={{ padding: "8px 16px" }}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      {msg && <p style={{ color: "green", marginTop: 12 }}>{msg}</p>}
      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}
    </div>
  );
}
