import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@shared/supabase";
import { Mail, Settings, AlertCircle } from "lucide-react";
export default function ComprehensiveDebug() {
    const [email, setEmail] = useState("slazengersnow@gmail.com");
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState("");
    const [supabaseConfig, setSupabaseConfig] = useState(null);
    const { toast } = useToast();
    useEffect(() => {
        // Get Supabase configuration
        const config = {
            url: import.meta.env.VITE_SUPABASE_URL,
            key: import.meta.env.VITE_SUPABASE_ANON_KEY,
            isDev: import.meta.env.DEV,
            mode: import.meta.env.MODE,
            origin: window.location.origin,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        };
        setSupabaseConfig(config);
        console.log("Supabase config loaded:", config);
    }, []);
    const testPasswordReset = async () => {
        if (!email) {
            toast({
                title: "メールアドレスが必要です",
                description: "テスト用のメールアドレスを入力してください",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        setDebugInfo("");
        try {
            // Multiple redirect URL variations to test
            const redirectUrls = [
                `${window.location.origin}/reset-password`,
                `${window.location.origin}/password-reset`,
                `${window.location.origin}/auth-redirect`,
                `${window.location.origin}/`,
            ];
            const results = [];
            for (const redirectUrl of redirectUrls) {
                console.log(`Testing password reset with redirect: ${redirectUrl}`);
                const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectUrl,
                });
                results.push({
                    redirectUrl,
                    data: data || null,
                    error: error
                        ? {
                            message: error.message,
                            status: error.status,
                            name: error.name,
                        }
                        : null,
                    timestamp: new Date().toISOString(),
                });
                // Wait a bit between requests to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            const debugResult = {
                email,
                config: supabaseConfig,
                results,
                totalTests: results.length,
                successCount: results.filter((r) => !r.error).length,
                errorCount: results.filter((r) => r.error).length,
            };
            setDebugInfo(JSON.stringify(debugResult, null, 2));
            console.log("Comprehensive password reset test results:", debugResult);
            const hasErrors = results.some((r) => r.error);
            if (hasErrors) {
                toast({
                    title: "パスワードリセットテスト完了",
                    description: "エラーが検出されました。デバッグ情報を確認してください。",
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワードリセットテスト完了",
                    description: "すべてのテストが成功しました。メールを確認してください。",
                });
            }
        }
        catch (error) {
            console.error("Password reset test exception:", error);
            setDebugInfo(JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
                config: supabaseConfig,
                timestamp: new Date().toISOString(),
            }, null, 2));
            toast({
                title: "エラー",
                description: "パスワードリセットテスト中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const testSupabaseStatus = async () => {
        try {
            // Test multiple Supabase operations
            const tests = [];
            // Test 1: Get session
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                tests.push({
                    test: "getSession",
                    success: !sessionError,
                    data: sessionData?.session?.user?.email || null,
                    error: sessionError?.message || null,
                });
            }
            catch (e) {
                tests.push({
                    test: "getSession",
                    success: false,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            // Test 2: Get user
            try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                tests.push({
                    test: "getUser",
                    success: !userError,
                    data: userData?.user?.email || null,
                    error: userError?.message || null,
                });
            }
            catch (e) {
                tests.push({
                    test: "getUser",
                    success: false,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            // Test 3: Simple sign-up test (without actually signing up)
            try {
                const testEmail = "test+noreply@example.com";
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: testEmail,
                    password: "testpassword123",
                    options: { data: { test: true } },
                });
                tests.push({
                    test: "signUp",
                    success: !signUpError,
                    data: signUpData?.user?.email || null,
                    error: signUpError?.message || null,
                });
            }
            catch (e) {
                tests.push({
                    test: "signUp",
                    success: false,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            const statusResult = {
                config: supabaseConfig,
                tests,
                timestamp: new Date().toISOString(),
            };
            setDebugInfo(JSON.stringify(statusResult, null, 2));
            console.log("Supabase status test results:", statusResult);
            toast({
                title: "Supabaseステータステスト完了",
                description: "結果をデバッグ情報で確認してください",
            });
        }
        catch (error) {
            console.error("Supabase status test error:", error);
            setDebugInfo(JSON.stringify({
                error: error.message || String(error),
                config: supabaseConfig,
                timestamp: new Date().toISOString(),
            }, null, 2));
            toast({
                title: "ステータステストエラー",
                description: "Supabaseステータステストに失敗しました",
                variant: "destructive",
            });
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-4xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(Settings, { className: "w-6 h-6" }), "\u5305\u62EC\u7684\u30E1\u30FC\u30EB\u9001\u4FE1\u8A3A\u65AD"] }), _jsx(CardDescription, { children: "Supabase\u30E1\u30FC\u30EB\u9001\u4FE1\u6A5F\u80FD\u306E\u8A73\u7D30\u30C6\u30B9\u30C8\u3068\u8A3A\u65AD" })] }), _jsxs(CardContent, { className: "space-y-6", children: [supabaseConfig && (_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsxs("h3", { className: "font-semibold mb-2 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "\u73FE\u5728\u306E\u8A2D\u5B9A"] }), _jsxs("div", { className: "text-sm space-y-1", children: [_jsxs("p", { children: [_jsx("strong", { children: "URL:" }), " ", supabaseConfig.url] }), _jsxs("p", { children: [_jsx("strong", { children: "\u30AD\u30FC\u9577:" }), " ", supabaseConfig.key?.length || 0, " ", "\u6587\u5B57"] }), _jsxs("p", { children: [_jsx("strong", { children: "\u74B0\u5883:" }), " ", supabaseConfig.mode, " (", supabaseConfig.isDev ? "開発" : "本番", ")"] }), _jsxs("p", { children: [_jsx("strong", { children: "Origin:" }), " ", supabaseConfig.origin] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30C6\u30B9\u30C8\u7528\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "test@example.com", className: "pl-10" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Button, { onClick: testPasswordReset, disabled: isLoading, className: "w-full", children: isLoading ? "テスト中..." : "包括的パスワードリセットテスト" }), _jsx(Button, { onClick: testSupabaseStatus, variant: "outline", className: "w-full", children: "Supabase\u30B9\u30C6\u30FC\u30BF\u30B9\u30C6\u30B9\u30C8" })] }), debugInfo && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u8A73\u7D30\u8A3A\u65AD\u7D50\u679C" }), _jsx("pre", { className: "bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[500px] font-mono", children: debugInfo })] })), _jsxs("div", { className: "bg-yellow-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2 text-yellow-800", children: "\u8A3A\u65AD\u306E\u30DD\u30A4\u30F3\u30C8" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u8907\u6570\u306E\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URL\u30D1\u30BF\u30FC\u30F3\u3067\u30C6\u30B9\u30C8" }), _jsx("li", { children: "\u2022 Supabase\u306E\u57FA\u672C\u6A5F\u80FD\u52D5\u4F5C\u78BA\u8A8D" }), _jsx("li", { children: "\u2022 \u74B0\u5883\u5909\u6570\u3068API\u8A2D\u5B9A\u306E\u691C\u8A3C" }), _jsx("li", { children: "\u2022 \u30E1\u30FC\u30EB\u9001\u4FE1\u30EC\u30FC\u30C8\u5236\u9650\u306E\u8003\u616E" }), _jsx("li", { children: "\u2022 \u8A73\u7D30\u306A\u30A8\u30E9\u30FC\u30ED\u30B0\u51FA\u529B" })] })] })] })] }) }));
}
