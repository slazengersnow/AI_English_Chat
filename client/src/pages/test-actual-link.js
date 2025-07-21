import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { CheckCircle, AlertCircle, ArrowRight, Home } from "lucide-react";
export default function TestActualLink() {
    const [results, setResults] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const actualLink = "https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IlBIL09xU0FyemREQmVvbGEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hjanBseWhxeGdyYmRoaXhtenNlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlYTU1ZmU3Zi0xZDlmLTQzNDMtYjUyNS04MDU2NDUxNGRlMGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjI4Mjk0LCJpYXQiOjE3NTIyMjQ2OTQsImVtYWlsIjoic2xhemVuZ2Vyc25vdzFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InNsYXplbmdlcnNub3cxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImVhNTVmZTdmLTFkOWYtNDM0My1iNTI1LTgwNTY0NTE0ZGUwZSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc1MjIyNDY5NH1dLCJzZXNzaW9uX2lkIjoiZWNlMjdhOWUtNmYzNS00Nzc2LWI4MGUtOWZlYmU1ZGYwNjkwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.DpDNlhVeRZtF1mcwKaKo3D_iRaaG2auPI6KMWWU4Rn0&expires_at=1752228294&expires_in=3600&refresh_token=ofdubrcmhxxa&token_type=bearer&type=signup";
    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };
    const addResult = (step, success, message, details) => {
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
            setSession: async (session) => {
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
            addResult("パラメータ解析", true, `
Type: ${type}
Access Token: ${accessToken ? "あり" : "なし"}
Refresh Token: ${refreshToken ? "あり" : "なし"}
Expires At: ${expiresAt}
Expires In: ${expiresIn}
Token Type: ${tokenType}
      `);
            if (!accessToken || !expiresAt) {
                addResult("パラメータ検証", false, "必須パラメータが不足しています");
                return;
            }
            // Check if token is expired
            const expiresAtTimestamp = parseInt(expiresAt);
            const now = Math.floor(Date.now() / 1000);
            const isExpired = now > expiresAtTimestamp;
            addResult("トークン有効期限", !isExpired, `
現在時刻: ${now}
有効期限: ${expiresAtTimestamp}
${isExpired ? "期限切れ" : "有効"}
      `);
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
            };
            const { data, error } = await mockSupabase.auth.setSession(session);
            if (error) {
                addResult("セッション設定", false, `セッション設定エラー: ${error.message}`);
                return;
            }
            addResult("セッション設定", true, "セッションの設定が成功しました");
            // Check current user
            const { data: userData, error: userError } = await mockSupabase.auth.getUser();
            if (userError) {
                addResult("ユーザー取得", false, `ユーザー取得エラー: ${userError.message}`);
            }
            else if (userData.user) {
                addResult("ユーザー取得", true, `ユーザー認証成功: ${userData.user.email}`);
                showToastMessage("認証成功: メールからの認証が完了しました！");
                // Simulate redirect to home after successful authentication
                setTimeout(() => {
                    addResult("リダイレクト", true, "ホームページにリダイレクトします...");
                    showToastMessage("ホームページにリダイレクトしています");
                }, 2000);
            }
            else {
                addResult("ユーザー取得", false, "ユーザーが見つかりません");
            }
        }
        catch (error) {
            console.error("Process actual link error:", error);
            addResult("エラー", false, `処理エラー: ${error.message}`);
        }
        finally {
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
            showToastMessage("リンクシミュレーション: 実際のメール確認リンクをシミュレートしています");
        }
    };
    const navigateToHome = () => {
        showToastMessage("ホームページに移動します");
        // In a real app, this would use router navigation
        setTimeout(() => {
            addResult("ナビゲーション", true, "ホームページへの移動をシミュレートしました");
        }, 1000);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: [showToast && (_jsx("div", { className: "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse", children: toastMessage })), _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(CheckCircle, { className: "w-6 h-6" }), "\u5B9F\u969B\u306E\u30E1\u30FC\u30EB\u78BA\u8A8D\u30EA\u30F3\u30AF\u30C6\u30B9\u30C8"] }), _jsx(CardDescription, { children: "\u5B9F\u969B\u306B\u9001\u4FE1\u3055\u308C\u305F\u30E1\u30FC\u30EB\u78BA\u8A8D\u30EA\u30F3\u30AF\u3092\u89E3\u6790\u30FB\u51E6\u7406\u3057\u307E\u3059" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2", children: "\u5B9F\u969B\u306E\u30E1\u30FC\u30EB\u78BA\u8A8D\u30EA\u30F3\u30AF:" }), _jsx("div", { className: "text-xs text-gray-600 break-all bg-white p-2 rounded border", children: actualLink })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Button, { onClick: processActualLink, disabled: isProcessing, className: "flex-1", children: isProcessing ? "処理中..." : "リンクを処理する" }), _jsxs(Button, { onClick: simulateHashNavigation, disabled: isProcessing, variant: "outline", className: "flex-1", children: [_jsx(ArrowRight, { className: "w-4 h-4 mr-2" }), "\u30EA\u30F3\u30AF\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30C8"] }), _jsxs(Button, { onClick: navigateToHome, disabled: isProcessing, variant: "secondary", className: "flex items-center gap-2", children: [_jsx(Home, { className: "w-4 h-4" }), "\u30DB\u30FC\u30E0"] })] }), results.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "\u51E6\u7406\u7D50\u679C:" }), _jsx("div", { className: "bg-white border rounded-lg p-4 max-h-96 overflow-auto", children: results.map((result, index) => (_jsxs("div", { className: "flex items-start gap-3 py-2 border-b last:border-b-0", children: [result.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: result.step }), _jsx("div", { className: "text-sm text-gray-600 whitespace-pre-line", children: result.message }), result.details && (_jsx("div", { className: "text-xs text-gray-500 mt-1", children: typeof result.details === "string"
                                                                ? result.details
                                                                : JSON.stringify(result.details) })), _jsx("div", { className: "text-xs text-gray-400", children: new Date(result.timestamp).toLocaleTimeString() })] })] }, index))) })] })), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-800 mb-2", children: "\u30C6\u30B9\u30C8\u60C5\u5831" }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u5B9F\u969B\u306E\u30E1\u30FC\u30EB\u78BA\u8A8D\u30EA\u30F3\u30AF\u3092\u4F7F\u7528\u3057\u3066\u30C6\u30B9\u30C8\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u30C8\u30FC\u30AF\u30F3\u306E\u6709\u52B9\u671F\u9650\u3092\u78BA\u8A8D\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 Supabase\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u8A2D\u5B9A\u3092\u8A66\u884C\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u6210\u529F\u3057\u305F\u5834\u5408\u3001\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8\u306B\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u3053\u306E\u30C7\u30E2\u3067\u306FSupabase\u306E\u4EE3\u308F\u308A\u306B\u30E2\u30C3\u30AF\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059" })] })] }), _jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-amber-800 mb-2", children: "\uD83D\uDD27 \u4FEE\u6B63\u70B9" }), _jsxs("ul", { className: "text-sm text-amber-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u30BB\u30C3\u30B7\u30E7\u30F3\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306E\u578B\u3092\u660E\u793A\u7684\u306B\u5B9A\u7FA9" }), _jsx("li", { children: "\u2022 expires_at \u306E\u578B\u30A8\u30E9\u30FC\u3092\u89E3\u6C7A" }), _jsx("li", { children: "\u2022 Supabase\u306E\u4EE3\u308F\u308A\u306B\u30E2\u30C3\u30AF\u95A2\u6570\u3092\u4F7F\u7528" }), _jsx("li", { children: "\u2022 \u30C8\u30FC\u30B9\u30C8\u901A\u77E5\u3092\u30AB\u30B9\u30BF\u30E0\u5B9F\u88C5" }), _jsx("li", { children: "\u2022 \u30A8\u30E9\u30FC\u30CF\u30F3\u30C9\u30EA\u30F3\u30B0\u3092\u6539\u5584" })] })] })] })] })] }));
}
