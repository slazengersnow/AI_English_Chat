// client/src/pages/login.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { useToast } from "../hooks/use-toast.js";
// ★ パスエイリアスを使わない（相対 import）
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../components/auth-provider.js";
import { Mail, Lock, Eye, EyeOff, TestTube, AlertTriangle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // どの Supabase を叩いているかを可視化
  useEffect(() => {
    // Vite の環境変数は build 時に静的展開される
    // ここで必ず Console に出して確認する
    // eslint-disable-next-line no-console
    console.log(
      "[Supabase] VITE_SUPABASE_URL =",
      (import.meta as any)?.env?.VITE_SUPABASE_URL,
    );
    // eslint-disable-next-line no-console
    console.log(
      "[Supabase] VITE_SUPABASE_ANON_KEY(head) =",
      String((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || "").slice(
        0,
        6,
      ),
    );
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.debug("login payload", { email, password: "***" });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // eslint-disable-next-line no-console
      console.log("Supabase login response:", {
        data: data
          ? {
              user: data.user
                ? {
                    id: data.user.id,
                    email: data.user.email,
                    confirmed: !!data.user.email_confirmed_at,
                  }
                : null,
              session: !!data.session,
            }
          : null,
        error: error
          ? { message: error.message, status: (error as any).status }
          : null,
      });

      if (error) {
        const isApiKeyError =
          error.message?.includes("Invalid API key") ||
          error.message?.includes("API key") ||
          (error as any).status === 401;

        const errorMessage = isApiKeyError
          ? "Supabase API設定に問題があります。VITE_SUPABASE_ANON_KEYを確認してください。"
          : error.message === "Invalid login credentials"
            ? "メールアドレスまたはパスワードが正しくありません。デモモードをお試しください。"
            : error.message;

        toast({
          title: "ログインエラー",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.user && data?.session) {
        // eslint-disable-next-line no-console
        console.log("Login successful with session");

        const { data: sessionCheck } = await supabase.auth.getSession();
        // eslint-disable-next-line no-console
        console.log("Session verification:", !!sessionCheck.session);

        toast({
          title: "ログイン成功",
          description: `ようこそ${data.user.email === "slazengersnow@gmail.com" ? "管理者" : ""}さん！`,
        });

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    } catch (err) {
      toast({
        title: "エラー",
        description: "ログイン中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    try {
      auth?.enableDemoMode?.();
      toast?.({
        title: "デモモード開始",
        description: "デモ用管理者アカウントでログインしました",
      });
      setTimeout(() => setLocation("/"), 1000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error in demo mode:", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      // eslint-disable-next-line no-console
      console.log("Google OAuth redirect:", redirectUrl);

      // 既存の supabase クライアントを利用（ハードコード禁止）
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      // eslint-disable-next-line no-console
      console.log("OAuth response:", { data, error });
      if (error) {
        toast({
          title: "Googleログインエラー",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Google OAuth exception:", err);
      toast({
        title: "エラー",
        description: "Googleログイン中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "メールアドレスが必要です",
        description: "パスワードリセットにはメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      const configurations = [
        {
          name: "標準設定",
          config: { redirectTo: `${window.location.origin}/reset-password` },
        },
        {
          name: "captchaオプション無し",
          config: {
            redirectTo: `${window.location.origin}/reset-password`,
            options: { captchaToken: null },
          },
        },
        {
          name: "HTTPSリダイレクト",
          config: {
            redirectTo: `https://${window.location.host}/reset-password`,
          },
        },
      ];

      // eslint-disable-next-line no-console
      console.log("Starting password reset attempts for:", email);

      for (const { name, config } of configurations) {
        // eslint-disable-next-line no-console
        console.log(`Attempting ${name} configuration:`, config);
        const { data, error } = await supabase.auth.resetPasswordForEmail(
          email,
          config as any,
        );
        // eslint-disable-next-line no-console
        console.log(`${name} result:`, { data, error });
        if (!error) {
          toast({
            title: "パスワードリセットメール送信完了",
            description: `${name}での送信が成功しました。メールをご確認ください。`,
          });
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      toast({
        title: "パスワードリセットエラー",
        description:
          "すべての設定で送信に失敗しました。詳細はコンソールをご確認ください。",
        variant: "destructive",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Password reset exception:", err);
      toast({
        title: "エラー",
        description: "パスワードリセット中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <CardTitle className="text-2xl">AI瞬間英作文チャット</CardTitle>
          <CardDescription>アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 緊急デモモード - 確実表示 */}
          <div
            style={{
              position: "relative",
              zIndex: 9999,
              display: "block",
              visibility: "visible",
              opacity: 1,
              background: "linear-gradient(135deg, #dc2626, #ea580c)",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "3px solid #dc2626",
              boxShadow: "0 10px 25px rgba(220, 38, 38, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                color: "white",
              }}
            >
              <span style={{ fontSize: "24px", marginRight: "8px" }}>🚨</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                緊急アクセスモード
              </h2>
            </div>
            <p
              style={{
                color: "white",
                fontSize: "14px",
                marginBottom: "16px",
                lineHeight: "1.4",
              }}
            >
              認証システムに問題が発生しています。
              <br />
              デモモードで即座にアプリをお試しください。
            </p>
            <button
              onClick={() => {
                localStorage.setItem("demoMode", "true");
                localStorage.setItem("emergencyDemo", "true");
                sessionStorage.setItem("demoActive", "true");
                window.location.href = "/";
              }}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "white",
                background: "linear-gradient(135deg, #b91c1c, #c2410c)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🚀 緊急デモモード開始
            </button>
            <div
              style={{
                textAlign: "center",
                marginTop: "12px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              認証を完全にバイパスして全機能を体験
            </div>
          </div>

          {/* 情報帯 */}
          <div
            className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4 mb-6"
            style={{ display: "block", visibility: "visible" }}
          >
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <h3 className="font-bold text-red-800">🚨 認証システム停止中</h3>
            </div>
            <p className="text-sm text-red-700 mb-3 font-medium">
              技術的問題により認証が利用できません。
              <br />
              デモモードで即座にアプリをお試しください。
            </p>
            <button
              onClick={handleDemoMode}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 text-lg shadow-lg rounded-lg transition-all duration-200 hover:scale-105"
              style={{ minHeight: "50px", fontSize: "16px" }}
            >
              🚀 緊急デモモード開始
            </button>
            <p className="text-xs text-center text-red-600 mt-2 font-bold">
              認証をバイパスして全機能を体験
            </p>
          </div>

          {/* 区切り */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500 font-medium">
                通常ログイン（現在停止中）
              </span>
            </div>
          </div>

          {/* 通常ログイン UI（今は disable） */}
          <form onSubmit={handleLogin} className="space-y-4 opacity-50">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.new@gmail.com"
                  className="pl-10"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="pl-10 pr-10"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled>
              サービス一時停止中
            </Button>
          </form>

          <div className="mt-2 text-center">
            <Button
              variant="link"
              className="text-sm text-gray-600 hover:text-gray-800"
              onClick={handlePasswordReset}
            >
              パスワードをお忘れですか？
            </Button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  または
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
              Googleでログイン
            </Button>

            <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-lg">
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold py-3 text-lg shadow-lg"
                onClick={handleDemoMode}
              >
                <TestTube className="w-5 h-5 mr-2" />
                🚀 デモモード（認証不要）
              </Button>
              <p className="text-xs text-center text-amber-700 mt-2 font-medium">
                認証エラーを回避してアプリを即座に体験
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">
              デモモード：Supabase認証エラーをバイパスして
              <br />
              アプリケーション機能をテストできます
            </p>

            {/* ★ 確実に /signup-simple に行けるデバッグリンク */}
            <p className="text-xs text-center mb-3">
              <Link href="/signup-simple" className="underline text-blue-600">
                （デバッグ）簡易サインアップへ移動
              </Link>
            </p>

            <div className="text-sm">
              <span className="text-gray-600">
                アカウントをお持ちでない方は
              </span>
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => setLocation("/signup")}
              >
                新規登録
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
