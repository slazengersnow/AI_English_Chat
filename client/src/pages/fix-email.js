import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@shared/supabase";
import { AlertTriangle, CheckCircle, Mail } from "lucide-react";
export default function FixEmail() {
    const [email, setEmail] = useState("slazengersnow@gmail.com");
    const [isLoading, setIsLoading] = useState(false);
    const [fixResults, setFixResults] = useState([]);
    const { toast } = useToast();
    const addResult = (step, success, message, details) => {
        setFixResults((prev) => [
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
    const fixEmailIssue = async () => {
        setIsLoading(true);
        setFixResults([]);
        try {
            // Step 1: Check if user exists
            addResult("ユーザー確認", true, "ユーザー存在確認を開始...");
            // First, try to sign up the user to ensure they exist
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: "TempPassword123!",
                options: {
                    emailRedirectTo: `${window.location.origin}/reset-password`,
                },
            });
            if (signUpError) {
                if (signUpError.message.includes("already registered")) {
                    addResult("ユーザー確認", true, "ユーザーは既に登録済みです");
                }
                else {
                    addResult("ユーザー確認", false, `サインアップエラー: ${signUpError.message}`);
                }
            }
            else {
                addResult("ユーザー確認", true, "ユーザーを新規作成しました");
            }
            // Step 2: Try different password reset approaches
            const resetAttempts = [
                {
                    name: "基本リセット",
                    config: {
                        redirectTo: `${window.location.origin}/reset-password`,
                    },
                },
                {
                    name: "HTTPSリセット",
                    config: {
                        redirectTo: `https://${window.location.host}/reset-password`,
                    },
                },
                {
                    name: "ルートリダイレクト",
                    config: {
                        redirectTo: `${window.location.origin}/`,
                    },
                },
                {
                    name: "オプション無し",
                    config: undefined,
                },
            ];
            for (const attempt of resetAttempts) {
                addResult("パスワードリセット", true, `${attempt.name}を試行中...`);
                const { data, error } = await supabase.auth.resetPasswordForEmail(email, attempt.config);
                if (error) {
                    addResult("パスワードリセット", false, `${attempt.name}失敗: ${error.message}`);
                }
                else {
                    addResult("パスワードリセット", true, `${attempt.name}成功！`);
                    // If successful, stop trying other methods
                    toast({
                        title: "修正完了",
                        description: `${attempt.name}でメール送信が成功しました`,
                    });
                    setIsLoading(false);
                    return;
                }
                // Wait between attempts
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
            // Step 3: Try resend confirmation
            addResult("確認メール再送", true, "確認メールの再送を試行中...");
            const { data: resendData, error: resendError } = await supabase.auth.resend({
                type: "signup",
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/reset-password`,
                },
            });
            if (resendError) {
                addResult("確認メール再送", false, `再送失敗: ${resendError.message}`);
            }
            else {
                addResult("確認メール再送", true, "確認メール再送成功！");
            }
            // Step 4: Emergency server-side reset
            addResult("緊急リセット要求", true, "サーバーサイドの緊急リセットを試行中...");
            try {
                const emergencyResponse = await fetch("/api/emergency-reset", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                });
                const emergencyData = await emergencyResponse.json();
                if (emergencyResponse.ok && emergencyData.success) {
                    addResult("緊急リセット要求", true, "緊急アクセス解決策を生成しました！");
                    // Show emergency credentials
                    if (emergencyData.solution) {
                        const solution = emergencyData.solution;
                        addResult("緊急アクセス情報", true, `
              一時パスワード: ${solution.credentials.temporaryPassword}
              有効期限: ${new Date(solution.expires).toLocaleString()}
              ログインURL: ${solution.loginUrl}
            `);
                        toast({
                            title: "緊急アクセス解決策",
                            description: "一時パスワードでログインできます。詳細は下記を確認してください。",
                        });
                    }
                }
                else {
                    addResult("緊急リセット要求", false, `緊急リセット失敗: ${emergencyData.error}`);
                }
            }
            catch (emergencyError) {
                addResult("緊急リセット要求", false, `緊急リセット通信エラー: ${emergencyError.message}`);
            }
            toast({
                title: "修正プロセス完了",
                description: "全ての修正手順が完了しました。結果を確認してください。",
            });
        }
        catch (error) {
            console.error("Fix email error:", error);
            addResult("エラー", false, `修正プロセスでエラーが発生: ${error.message}`);
            toast({
                title: "修正エラー",
                description: "メール送信の修正中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(Mail, { className: "w-6 h-6" }), "\u30E1\u30FC\u30EB\u9001\u4FE1\u554F\u984C\u306E\u4FEE\u6B63"] }), _jsx(CardDescription, { children: "Supabase\u306E\u30E1\u30FC\u30EB\u9001\u4FE1\u554F\u984C\u3092\u5305\u62EC\u7684\u306B\u4FEE\u6B63\u3057\u307E\u3059" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "slazengersnow@gmail.com" })] }), _jsx(Button, { onClick: fixEmailIssue, disabled: isLoading, className: "w-full", children: isLoading ? "修正中..." : "メール送信問題を修正する" }), fixResults.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u4FEE\u6B63\u30D7\u30ED\u30BB\u30B9" }), _jsx("div", { className: "bg-white border rounded-lg p-4 max-h-96 overflow-auto", children: fixResults.map((result, index) => (_jsxs("div", { className: "flex items-start gap-3 py-2 border-b last:border-b-0", children: [result.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mt-0.5" })) : (_jsx(AlertTriangle, { className: "w-5 h-5 text-red-500 mt-0.5" })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: result.step }), _jsx("div", { className: "text-sm text-gray-600", children: result.message }), result.details && (_jsx("div", { className: "text-xs text-gray-500 mt-1", children: typeof result.details === "string"
                                                            ? result.details
                                                            : JSON.stringify(result.details) })), _jsx("div", { className: "text-xs text-gray-400", children: new Date(result.timestamp).toLocaleTimeString() })] })] }, index))) })] })), _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-red-800 mb-2", children: "\u91CD\u8981\u306A\u6CE8\u610F\u4E8B\u9805" }), _jsxs("ul", { className: "text-sm text-red-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u3053\u306E\u30C4\u30FC\u30EB\u306F\u8907\u6570\u306E\u30A2\u30D7\u30ED\u30FC\u30C1\u3067\u30E1\u30FC\u30EB\u9001\u4FE1\u3092\u8A66\u884C\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u7BA1\u7406\u8005\u6A29\u9650\u3092\u4F7F\u7528\u3057\u3066\u76F4\u63A5\u30EA\u30BB\u30C3\u30C8\u30EA\u30F3\u30AF\u3092\u751F\u6210\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u6210\u529F\u3057\u305F\u5834\u5408\u3001\u305D\u306E\u30EA\u30F3\u30AF\u3092\u4F7F\u7528\u3057\u3066\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u304C\u53EF\u80FD\u3067\u3059" }), _jsx("li", { children: "\u2022 \u5168\u3066\u306E\u624B\u9806\u3067\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3059\u308B\u5834\u5408\u3001Supabase\u306E\u8A2D\u5B9A\u306B\u554F\u984C\u304C\u3042\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059" })] })] })] })] }) }));
}
