import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function SignupSimple() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function onSignup() {
    if (!email || !password) {
      setOut({
        error: { message: "メールアドレスとパスワードを入力してください" },
      });
      return;
    }

    if (password.length < 6) {
      setOut({ error: { message: "パスワードは6文字以上で入力してください" } });
      return;
    }

    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setOut({ error: { message: "有効なメールアドレスを入力してください" } });
      return;
    }

    setLoading(true);
    setOut(null); // 前のメッセージをクリア
    console.log("[SignupSimple] start", { email });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), // 前後の空白を除去
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=subscription-select`,
        },
      });

      console.log("[SignupSimple] resp", { data, error });

      if (error) {
        console.error("[SignupSimple] error:", error);

        // 既存メール時のエラー処理（より詳細に）
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered") ||
          error.status === 422 ||
          error.message.includes("User already registered")
        ) {
          setOut({
            error: {
              message:
                "このメールアドレスは既に登録されています。ログインページをご利用ください。",
            },
          });
        } else if (error.message.toLowerCase().includes("password")) {
          setOut({
            error: {
              message:
                "パスワードは6文字以上で、英数字を含める必要があります。",
            },
          });
        } else if (error.message.toLowerCase().includes("email")) {
          setOut({
            error: {
              message: "有効なメールアドレスを入力してください。",
            },
          });
        } else {
          setOut({
            error: {
              message:
                error.message || "登録に失敗しました。再度お試しください。",
            },
          });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("[SignupSimple] user created:", data.user.email);

        // メール確認が必要な場合（Confirm email = ON）
        if (!data.session) {
          setOut({
            data: {
              message:
                "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
              user: data.user,
              email: data.user.email,
            },
          });
          setLoading(false);
          return;
        }

        // セッションがある場合（Confirm email = OFF）はプラン選択画面へ
        console.log(
          "[SignupSimple] session created, redirecting to subscription select",
        );
        setOut({
          data: {
            message: "登録完了！プラン選択画面に移動します...",
            user: data.user,
          },
        });

        // 少し遅延してからリダイレクト（ユーザーにメッセージを見せるため）
        setTimeout(() => {
          navigate("/subscription/select", { replace: true });
        }, 1500);
      } else {
        setOut({ error: { message: "登録処理でエラーが発生しました。" } });
        setLoading(false);
      }
    } catch (catchError: any) {
      console.error("[SignupSimple] catch error:", catchError);
      setOut({
        error: {
          message:
            "ネットワークエラーが発生しました。インターネット接続を確認してください。",
        },
      });
      setLoading(false);
    }
  }

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  // @ts-expect-error - デバッグ用のグローバル変数
  const dbg = window.SUPA_DEBUG;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        fontFamily: "sans-serif",
        backgroundColor: "#e7effe",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "#333",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          新規登録
        </h1>
        <p
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "#666",
            fontSize: "16px",
          }}
        >
          AI英作文チャットで英語力を向上させましょう
        </p>

        {dbg && (
          <div
            style={{
              marginBottom: "16px",
              fontSize: "12px",
              color: "#888",
              backgroundColor: "#f8f9fa",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #e9ecef",
            }}
          >
            <p style={{ margin: "2px 0" }}>
              VITE URL: <code>{dbg?.url}</code>
            </p>
            <p style={{ margin: "2px 0" }}>
              VITE ANON(head): <code>{dbg?.anonHead}</code>
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              メールアドレス *
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              type="email"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
                backgroundColor: loading ? "#f8f9fa" : "white",
                cursor: loading ? "not-allowed" : "text",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "500",
                color: "#333",
              }}
            >
              パスワード *
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              type="password"
              required
              minLength={6}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
                backgroundColor: loading ? "#f8f9fa" : "white",
                cursor: loading ? "not-allowed" : "text",
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              6文字以上で入力してください
            </small>
          </div>

          <button
            onClick={onSignup}
            disabled={loading || !email || !password}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor:
                loading || !email || !password ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor:
                loading || !email || !password ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff3d",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "8px",
                  }}
                ></span>
                登録中...
              </span>
            ) : (
              "新規登録"
            )}
          </button>
        </div>

        {out && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "4px",
              backgroundColor: out.error ? "#fee" : "#efe",
              border: out.error ? "1px solid #fcc" : "1px solid #cfc",
            }}
          >
            {out.error ? (
              <p style={{ color: "#c33", margin: 0, fontWeight: "500" }}>
                ❌ {out.error.message}
              </p>
            ) : out.data?.message ? (
              <p style={{ color: "#393", margin: 0, fontWeight: "500" }}>
                ✅ {out.data.message}
                {out.data.email && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    送信先: {out.data.email}
                  </span>
                )}
              </p>
            ) : (
              <details style={{ fontSize: "12px" }}>
                <summary style={{ cursor: "pointer", color: "#666" }}>
                  詳細情報を表示
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "11px",
                    margin: "8px 0 0 0",
                    backgroundColor: "#f8f9fa",
                    padding: "8px",
                    borderRadius: "4px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(out, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            既にアカウントをお持ちの方は{" "}
            <button
              onClick={handleLoginRedirect}
              disabled={loading}
              style={{
                color: "#007bff",
                background: "none",
                border: "none",
                textDecoration: "underline",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              ログイン
            </button>
          </p>
        </div>
      </div>

      {/* スピナーアニメーション用CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
