import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // ✅ 完全に新しいサインアップ処理 - signInWithPasswordは使用しません
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log(
      "🚀 [SIGNUP-NEW] 完全に新しいコード実行中 - signInWithPassword呼び出しなし",
      new Date().toISOString(),
    );

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("利用規約とプライバシーポリシーに同意してください");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔄 [SIGNUP-NEW] サインアップ処理開始...");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
        },
      });

      console.log("📧 [SIGNUP-NEW] signUp結果:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        error: error?.message,
      });

      // ✅ エラーがある場合
      if (error) {
        console.log("❌ [SIGNUP-NEW] signUpエラー:", error);

        // 既存ユーザーのエラーパターンを確認
        if (error.message && error.message.toLowerCase().includes("already")) {
          setError(
            "このメールアドレスは既に登録されています。ログインをお試しください。",
          );
          return;
        }

        setError(`サインアップに失敗しました: ${error.message}`);
        return;
      }

      // ✅ メール確認が必要な場合（新規ユーザーの正常なケース）
      if (!data.session && data.user) {
        console.log("📧 [DEBUG] User details:", data.user);

        // 既存ユーザー判定: email_confirmed_atが存在すれば既存ユーザー
        if (new Date(data.user.created_at) < new Date(Date.now() - 10000)) {
          console.log("⚠️ [SIGNUP-NEW] 既存ユーザー検出");
          setError(
            "このメールアドレスは既に登録されています。ログインをお試しください。",
          );
        } else {
          console.log("✅ [SIGNUP-NEW] 新規ユーザー - 認証メール送信完了");
          setSuccess(
            "認証メールを送信しました。メール内のリンクをクリックして認証を完了してください。",
          );
        }
        return;
      }

      // その他の予期しないケース
      console.log("⚠️ [SIGNUP-NEW] 予期しない状態");
      setSuccess(
        "認証メールを送信しました。メール内のリンクをクリックして認証を完了してください。",
      );
    } catch (err: any) {
      console.error("❌ サインアップエラー:", err);
      setError(err.message || "アカウント作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError("利用規約とプライバシーポリシーに同意してください");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔄 Google OAuth signup starting...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false, // ブラウザリダイレクトを許可
        },
      });

      console.log("📧 Google OAuth result:", { data, error });

      if (error) {
        console.error("❌ Google OAuth error:", error);
        throw error;
      }

      // OAuth認証の場合はリダイレクトが起きるので、ここに到達することは通常ない
    } catch (error: any) {
      console.error("Google signup error:", error);
      setError(error.message || "Googleサインアップに失敗しました。Google認証が有効でない可能性があります。");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e7effe] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI瞬間英作文チャット
          </h1>
          <p className="text-gray-600">新規アカウント作成</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                6文字以上で入力してください
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                パスワード確認
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを再入力"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate("/terms")}
                    className="text-blue-600 hover:text-blue-500 underline"
                  >
                    利用規約
                  </button>
                  に同意します
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="privacy"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy" className="ml-2 text-sm text-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate("/privacy")}
                    className="text-blue-600 hover:text-blue-500 underline"
                  >
                    プライバシーポリシー
                  </button>
                  に同意します
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !termsAccepted || !privacyAccepted}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "登録中..." : "アカウント作成"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignup}
              disabled={loading || !termsAccepted || !privacyAccepted}
              className={`mt-4 w-full font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 ${
                loading || !termsAccepted || !privacyAccepted
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={(!termsAccepted || !privacyAccepted) ? "利用規約とプライバシーポリシーに同意してください" : ""}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "登録中..." : "Googleで登録"}
            </button>

            {(!termsAccepted || !privacyAccepted) && (
              <p className="text-xs text-gray-500 text-center mt-2">
                ※ 利用規約とプライバシーポリシーに同意するとGoogleログインが利用できます
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの場合は{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
