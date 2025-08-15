import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function SignupSimple() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
        },
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (
          error.status === 400 ||
          msg.includes("already") ||
          msg.includes("exists")
        ) {
          setError(
            "このメールアドレスは既に登録されています。ログインしてください。",
          );
          return;
        }
        setError(error.message);
        return;
      }

      if (!data.session) {
        // Confirm email ON の場合はここでメール確認待ち
        setInfo(
          "確認メールを送信しました。メール内のリンクを開いてからログインしてください。",
        );
        return;
      }

      // ここに来たらセッションあり＝そのまま次の画面へ
      navigate("/subscription-select");
    } catch (e: any) {
      setError(`サインアップエラー: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Signup Simple (Debug)</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            type="email"
            required
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            required
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {error && (
        <p
          style={{
            marginTop: 12,
            color: "#dc3545",
            backgroundColor: "#f8d7da",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #f5c6cb",
          }}
        >
          {error}
        </p>
      )}

      {info && (
        <p
          style={{
            marginTop: 12,
            color: "#155724",
            backgroundColor: "#d4edda",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #c3e6cb",
          }}
        >
          {info}
        </p>
      )}

      <p style={{ marginTop: 12 }}>
        <Link to="/login" style={{ color: "#007bff", textDecoration: "none" }}>
          ログインへ
        </Link>
      </p>

      <pre
        style={{
          marginTop: 12,
          fontSize: 12,
          backgroundColor: "#f8f9fa",
          padding: 8,
          borderRadius: 4,
          overflow: "auto",
        }}
      >
        {JSON.stringify((window as any).SUPA_DEBUG, null, 2)}
      </pre>
    </div>
  );
}
