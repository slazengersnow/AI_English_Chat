import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertCircle, ArrowRight, Home } from "lucide-react";

export default function TestActualLink() {
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const actualLink =
    "https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IlBIL09xU0FyemREQmVvbGEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hjanBseWhxeGdyYmRoaXhtenNlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlYTU1ZmU3Zi0xZDlmLTQzNDMtYjUyNS04MDU2NDUxNGRlMGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjI4Mjk0LCJpYXQiOjE3NTIyMjQ2OTQsImVtYWlsIjoic2xhemVuZ2Vyc25vdzFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InNsYXplbmdlcnNub3cxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImVhNTVmZTdmLTFkOWYtNDM0My1iNTI1LTgwNTY0NTE0ZGUwZSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc1MjIyNDY5NH1dLCJzZXNzaW9uX2lkIjoiZWNlMjdhOWUtNmYzNS00Nzc2LWI4MGUtOWZlYmU1ZGYwNjkwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.DpDNlhVeRZtF1mcwKaKo3D_iRaaG2auPI6KMWWU4Rn0&expires_at=1752228294&expires_in=3600&refresh_token=ofdubrcmhxxa&token_type=bearer&type=signup";

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addResult = (
    step: string,
    success: boolean,
    message: string,
    details?: any,
  ) => {
    setResults((prev) => [
      ...prev,
      {
        step,
        success,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Supabase設定のシミュレーション
  const mockSupabase = {
    auth: {
      setSession: async (session: any) => {
        // セッション設定のシミュレーション
        await new Promise((resolve) => setTimeout(resolve, 500));

        // トークンが期限切れかどうかをチェック
        const now = Math.floor(Date.now() / 1000);
        if (now > session.expires_at) {
          throw new Error("Token has expired");
        }

        return { data: { session }, error: null };
      },
      getUser: async () => {
        // ユーザー取得のシミュレーション
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          data: {
            user: {
              id: "ea55fe7f-1d9f-4343-b525-805645114de0e",
              email: "slazengersno1@gmail.com",
              email_verified: true,
            },
          },
          error: null,
        };
      },
    },
  };

  const processActualLink = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      // Extract hash from the actual link
      const hashPart = actualLink.split("#")[1];

      if (!hashPart) {
        addResult("リンク解析", false, "ハッシュフラグメントが見つかりません");
        return;
      }

      addResult("リンク解析", true, "ハッシュフラグメントを検出しました");

      // Parse the parameters
      const params = new URLSearchParams(hashPart);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresAt = params.get("expires_at");
      const expiresIn = params.get("expires_in");
      const tokenType = params.get("token_type");
      const type = params.get("type");

      addResult(
        "パラメータ解析",
        true,
        `
Type: ${type}
Access Token: ${accessToken ? "あり" : "なし"}
Refresh Token: ${refreshToken ? "あり" : "なし"}
Expires At: ${expiresAt}
Expires In: ${expiresIn}
Token Type: ${tokenType}
      `,
      );

      if (!accessToken || !expiresAt) {
        addResult("パラメータ検証", false, "必須パラメータが不足しています");
        return;
      }

      // Check if token is expired
      const expiresAtTimestamp = parseInt(expiresAt);
      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > expiresAtTimestamp;

      addResult(
        "トークン有効期限",
        !isExpired,
        `
現在時刻: ${now}
有効期限: ${expiresAtTimestamp}
${isExpired ? "期限切れ" : "有効"}
      `,
      );

      if (isExpired) {
        addResult("認証処理", false, "トークンが期限切れです");
        return;
      }

      // Try to set the session - 修正されたセッション設定
      addResult("セッション設定", true, "Supabaseセッションを設定中...");

      // セッションオブジェクトを正しい型で構築
      const session = {
        access_token: accessToken,
        refresh_token: refreshToken || "",
        expires_at: expiresAtTimestamp,
        token_type: tokenType || "bearer",
        user: null,
      } as {
        access_token: string;
        refresh_token: string;
        expires_at: number;
        token_type: string;
        user: null;
      };

      const { data, error } = await mockSupabase.auth.setSession(session);

      if (error) {
        addResult(
          "セッション設定",
          false,
          `セッション設定エラー: ${(error as Error).message}`,
        );
        return;
      }

      addResult("セッション設定", true, "セッションの設定が成功しました");

      // Check current user
      const { data: userData, error: userError } =
        await mockSupabase.auth.getUser();

      if (userError) {
        addResult(
          "ユーザー取得",
          false,
          `ユーザー取得エラー: ${(userError as Error).message}`,
        );
      } else if (userData.user) {
        addResult(
          "ユーザー取得",
          true,
          `ユーザー認証成功: ${userData.user.email}`,
        );

        showToastMessage("認証成功: メールからの認証が完了しました！");

        // Simulate redirect to home after successful authentication
        setTimeout(() => {
          addResult(
            "リダイレクト",
            true,
            "ホームページにリダイレクトします...",
          );
          showToastMessage("ホームページにリダイレクトしています");
        }, 2000);
      } else {
        addResult("ユーザー取得", false, "ユーザーが見つかりません");
      }
    } catch (error: any) {
      console.error("Process actual link error:", error);
      addResult("エラー", false, `処理エラー: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateHashNavigation = () => {
    // Simulate what happens when user clicks the actual link
    const hashPart = actualLink.split("#")[1];

    if (hashPart) {
      // Set the hash in current URL
      window.location.hash = hashPart;

      // Trigger hash change event
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      showToastMessage(
        "リンクシミュレーション: 実際のメール確認リンクをシミュレートしています",
      );
    }
  };

  const navigateToHome = () => {
    showToastMessage("ホームページに移動します");
    // In a real app, this would use router navigation
    setTimeout(() => {
      addResult(
        "ナビゲーション",
        true,
        "ホームページへの移動をシミュレートしました",
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {toastMessage}
        </div>
      )}

      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            実際のメール確認リンクテスト
          </CardTitle>
          <CardDescription>
            実際に送信されたメール確認リンクを解析・処理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">実際のメール確認リンク:</h3>
            <div className="text-xs text-gray-600 break-all bg-white p-2 rounded border">
              {actualLink}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={processActualLink}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "処理中..." : "リンクを処理する"}
            </Button>

            <Button
              onClick={simulateHashNavigation}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              リンクをシミュレート
            </Button>

            <Button
              onClick={navigateToHome}
              disabled={isProcessing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              ホーム
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">処理結果:</h3>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 border-b last:border-b-0"
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-line">
                        {result.message}
                      </div>
                      {result.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {typeof result.details === "string"
                            ? result.details
                            : JSON.stringify(result.details)}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">テスト情報</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 実際のメール確認リンクを使用してテストします</li>
              <li>• トークンの有効期限を確認します</li>
              <li>• Supabaseセッションの設定を試行します</li>
              <li>• 成功した場合、ホームページにリダイレクトします</li>
              <li>• このデモではSupabaseの代わりにモックを使用しています</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">🔧 修正点</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• セッションオブジェクトの型を明示的に定義</li>
              <li>• expires_at の型エラーを解決</li>
              <li>• Supabaseの代わりにモック関数を使用</li>
              <li>• トースト通知をカスタム実装</li>
              <li>• エラーハンドリングを改善</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
