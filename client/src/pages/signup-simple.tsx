import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SignupSimple() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` }
      });
      if (error) {
        // 既存メールの詳細チェック
        if (error.message?.toLowerCase().includes('already') || 
            error.message?.toLowerCase().includes('registered') ||
            (error as any).status === 422 || 
            (error as any).status === 400) {
          setMsg("このメールアドレスは既に登録されています。ログインをお試しください。");
        } else {
          setMsg(`サインアップに失敗: ${error.message}`);
        }
        return;
      }
      // Confirm Email = ON の場合は session が付かないので案内だけ表示
      if (data?.user && !data?.session) {
        setMsg("確認メールを送信しました。メール内のリンクから認証を完了してください。");
        return;
      }
      // Confirm Email = OFF の運用時は即ログイン＆遷移（保険として実装）
      if (data?.user && data?.session) {
        nav("/subscription-select");
      }
    } catch (e: any) {
      setMsg(`サインアップエラー: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:480, margin:"40px auto", padding:16}}>
      <h1>Signup Simple (Debug)</h1>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" type="email" required />
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="password" type="password" required />
        <button disabled={loading} type="submit">Create Account</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
      <pre style={{marginTop:12}}>{typeof window !== "undefined" ? JSON.stringify((window as any).SUPA_DEBUG,null,2) : null}</pre>
    </div>
  );
}