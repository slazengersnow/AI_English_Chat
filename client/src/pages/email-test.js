import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@shared/supabase";
import { Mail, CheckCircle, XCircle } from "lucide-react";
export default function EmailTest() {
    const [email, setEmail] = useState("slazengersnow@gmail.com");
    const [password, setPassword] = useState("TestPassword123!");
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const { toast } = useToast();
    const addTestResult = (testName, success, details) => {
        setTestResults((prev) => [
            ...prev,
            {
                testName,
                success,
                details,
                timestamp: new Date().toISOString(),
            },
        ]);
    };
    const testSignUp = async () => {
        try {
            console.log("Testing sign up with email:", email);
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { test: true },
                },
            });
            console.log("Sign up result:", { data, error });
            if (error) {
                if (error.message.includes("already registered")) {
                    addTestResult("サインアップテスト", true, "既に登録済み（正常）");
                    return true;
                }
                else {
                    addTestResult("サインアップテスト", false, error.message);
                    return false;
                }
            }
            addTestResult("サインアップテスト", true, "新規登録成功");
            return true;
        }
        catch (error) {
            console.error("Sign up error:", error);
            addTestResult("サインアップテスト", false, error.message || String(error));
            return false;
        }
    };
    const testPasswordReset = async () => {
        try {
            console.log("Testing password reset with email:", email);
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            console.log("Password reset result:", { data, error });
            if (error) {
                addTestResult("パスワードリセット", false, error.message);
                return false;
            }
            addTestResult("パスワードリセット", true, "リセット要求送信成功");
            return true;
        }
        catch (error) {
            console.error("Password reset error:", error);
            addTestResult("パスワードリセット", false, error.message || String(error));
            return false;
        }
    };
    const testResendConfirmation = async () => {
        try {
            console.log("Testing resend confirmation with email:", email);
            const { data, error } = await supabase.auth.resend({
                type: "signup",
                email: email,
            });
            console.log("Resend confirmation result:", { data, error });
            if (error) {
                addTestResult("確認メール再送", false, error.message);
                return false;
            }
            addTestResult("確認メール再送", true, "確認メール再送成功");
            return true;
        }
        catch (error) {
            console.error("Resend confirmation error:", error);
            addTestResult("確認メール再送", false, error.message || String(error));
            return false;
        }
    };
    const runAllTests = async () => {
        setIsLoading(true);
        setTestResults([]);
        try {
            // Test 1: Sign up (to trigger email)
            await testSignUp();
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Test 2: Password reset
            await testPasswordReset();
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Test 3: Resend confirmation
            await testResendConfirmation();
            toast({
                title: "全テスト完了",
                description: "すべてのメール送信テストが完了しました。結果を確認してください。",
            });
        }
        catch (error) {
            console.error("Test suite error:", error);
            toast({
                title: "テストエラー",
                description: "テスト実行中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-3xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(Mail, { className: "w-6 h-6" }), "Supabase\u30E1\u30FC\u30EB\u9001\u4FE1\u30C6\u30B9\u30C8"] }), _jsx(CardDescription, { children: "\u30B5\u30A4\u30F3\u30A2\u30C3\u30D7\u3001\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u3001\u78BA\u8A8D\u30E1\u30FC\u30EB\u518D\u9001\u306E\u5305\u62EC\u7684\u30C6\u30B9\u30C8" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30C6\u30B9\u30C8\u7528\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "test@example.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\u30C6\u30B9\u30C8\u7528\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "TestPassword123!" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2", children: [_jsx(Button, { onClick: testSignUp, disabled: isLoading, variant: "outline", size: "sm", children: "\u30B5\u30A4\u30F3\u30A2\u30C3\u30D7\u30C6\u30B9\u30C8" }), _jsx(Button, { onClick: testPasswordReset, disabled: isLoading, variant: "outline", size: "sm", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8" }), _jsx(Button, { onClick: testResendConfirmation, disabled: isLoading, variant: "outline", size: "sm", children: "\u78BA\u8A8D\u30E1\u30FC\u30EB\u518D\u9001" }), _jsx(Button, { onClick: runAllTests, disabled: isLoading, className: "w-full", children: isLoading ? "実行中..." : "全テスト実行" })] }), testResults.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u30C6\u30B9\u30C8\u7D50\u679C" }), _jsx("div", { className: "bg-white border rounded-lg p-4 max-h-96 overflow-auto", children: testResults.map((result, index) => (_jsxs("div", { className: "flex items-center gap-3 py-2 border-b last:border-b-0", children: [result.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" })) : (_jsx(XCircle, { className: "w-5 h-5 text-red-500" })), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: result.testName }), _jsx("div", { className: "text-sm text-gray-600", children: result.details }), _jsx("div", { className: "text-xs text-gray-400", children: new Date(result.timestamp).toLocaleString() })] })] }, index))) })] })), _jsxs("div", { className: "bg-yellow-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2 text-yellow-800", children: "\u6CE8\u610F\u4E8B\u9805" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u30C6\u30B9\u30C8\u30E1\u30FC\u30EB\u306F\u5B9F\u969B\u306B\u9001\u4FE1\u3055\u308C\u307E\u3059" }), _jsx("li", { children: "\u2022 \u65E2\u306B\u767B\u9332\u6E08\u307F\u306E\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3067\u3082\u30C6\u30B9\u30C8\u53EF\u80FD" }), _jsx("li", { children: "\u2022 Supabase\u306E\u8A2D\u5B9A\u306B\u3088\u3063\u3066\u306F\u30E1\u30FC\u30EB\u9001\u4FE1\u306B\u6642\u9593\u304C\u304B\u304B\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059" }), _jsx("li", { children: "\u2022 \u30EC\u30FC\u30C8\u5236\u9650\u3092\u907F\u3051\u308B\u305F\u3081\u30C6\u30B9\u30C8\u9593\u306B\u9045\u5EF6\u3092\u8A2D\u3051\u3066\u3044\u307E\u3059" })] })] })] })] }) }));
}
