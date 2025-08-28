import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("email not confirmed") || msg.includes("confirm")) {
          setError(
            "メール認証が完了していません。メール内のリンクを開いてから再度お試しください。",
          );
        } else {
          setError(error.message);
        }
        return;
      }

      navigate("/");
    } catch (error: any) {
      setError(error.message || "ログインに失敗しました");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          skipBrowserRedirect: true, // iframe制限を回避
        },
      });

      if (error) {
        console.error("❌ Google OAuth error:", error);
        throw error;
      }

      // データがある場合は、新しいウィンドウでOAuth URLを開く
      if (data?.url) {
        console.log("🔗 Opening Google login in new window:", data.url);
        // iframe制限を回避するため、親ウィンドウで開く
        if (window.parent && window.parent !== window) {
          window.parent.open(data.url, '_blank');
        } else {
          window.open(data.url, '_blank');
        }
      }
      setLoading(false);
    } catch (error: any) {
      setError(error.message || "Googleログインに失敗しました");
      console.error("Google login error:", error);
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    console.log("デモモード有効化");
    navigate("/demo");
  };

  return (
    <div className="min-h-screen bg-[#e7effe] flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            AI瞬間英作文チャット
          </h1>
          <p className="text-gray-600 text-sm">ログインまたはデモで開始</p>
        </div>

        {/* デモアクセスボタン */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg">
          <button
            onClick={handleDemoMode}
            className="w-full bg-transparent text-white font-bold py-4 px-6 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
          >
            🚀 デモで体験する
            <div className="text-xs opacity-90 mt-1">認証不要で即座に開始</div>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              {loading ? "ログイン中..." : "Googleでログイン"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない場合は{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                アカウント作成
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
