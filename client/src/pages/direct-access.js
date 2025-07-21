import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@shared/supabase';
import { useLocation } from 'wouter';
import { Key, AlertCircle } from 'lucide-react';
export default function DirectAccess() {
    const [email, setEmail] = useState('slazengersnow@gmail.com');
    const [tempPassword, setTempPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const handleDirectLogin = async () => {
        if (!email || !tempPassword) {
            toast({
                title: "入力エラー",
                description: "メールアドレスと一時パスワードを入力してください",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        try {
            // Try to sign in with the temporary password
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: tempPassword,
            });
            if (error) {
                // If login fails, try to create a new account
                console.log('Login failed, trying to create new account:', error.message);
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: email,
                    password: tempPassword,
                });
                if (signUpError) {
                    toast({
                        title: "アクセスエラー",
                        description: `アカウント作成に失敗しました: ${signUpError.message}`,
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                    title: "アカウント作成成功",
                    description: "新しいアカウントを作成しました。パスワードを変更してください。",
                });
                // Redirect to home page
                setLocation('/');
            }
            else {
                toast({
                    title: "ログイン成功",
                    description: "一時パスワードでログインできました。",
                });
                // Redirect to home page
                setLocation('/');
            }
        }
        catch (error) {
            console.error('Direct access error:', error);
            toast({
                title: "エラー",
                description: "直接アクセス中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const generateEmergencyCredentials = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/emergency-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                const solution = data.solution;
                setTempPassword(solution.credentials.temporaryPassword);
                toast({
                    title: "緊急パスワード生成成功",
                    description: "一時パスワードを生成しました。24時間有効です。",
                });
            }
            else {
                toast({
                    title: "パスワード生成エラー",
                    description: data.error || "パスワードの生成に失敗しました",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Emergency credentials error:', error);
            toast({
                title: "エラー",
                description: "緊急パスワード生成中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl flex items-center justify-center gap-2", children: [_jsx(Key, { className: "w-6 h-6" }), "\u7DCA\u6025\u30A2\u30AF\u30BB\u30B9"] }), _jsx(CardDescription, { children: "\u30E1\u30FC\u30EB\u9001\u4FE1\u554F\u984C\u306E\u56DE\u907F\u7B56\u3068\u3057\u3066\u3001\u76F4\u63A5\u30A2\u30AF\u30BB\u30B9\u3092\u63D0\u4F9B\u3057\u307E\u3059" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "slazengersnow@gmail.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "tempPassword", children: "\u4E00\u6642\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsx(Input, { id: "tempPassword", type: "password", value: tempPassword, onChange: (e) => setTempPassword(e.target.value), placeholder: "\u7DCA\u6025\u30D1\u30B9\u30EF\u30FC\u30C9" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: generateEmergencyCredentials, disabled: isLoading, variant: "outline", className: "w-full", children: isLoading ? "生成中..." : "緊急パスワードを生成" }), _jsx(Button, { onClick: handleDirectLogin, disabled: isLoading || !tempPassword, className: "w-full", children: isLoading ? "アクセス中..." : "直接アクセス" })] }), _jsx("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-sm text-orange-700", children: [_jsx("p", { className: "font-medium mb-1", children: "\u91CD\u8981\u306A\u6CE8\u610F\u4E8B\u9805\uFF1A" }), _jsxs("ul", { className: "space-y-1 text-xs", children: [_jsx("li", { children: "\u2022 \u4E00\u6642\u30D1\u30B9\u30EF\u30FC\u30C9\u306F24\u6642\u9593\u3067\u7121\u52B9\u306B\u306A\u308A\u307E\u3059" }), _jsx("li", { children: "\u2022 \u30ED\u30B0\u30A4\u30F3\u5F8C\u3001\u5FC5\u305A\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx("li", { children: "\u2022 \u3053\u306E\u6A5F\u80FD\u306F\u30E1\u30FC\u30EB\u9001\u4FE1\u554F\u984C\u306E\u4E00\u6642\u7684\u306A\u89E3\u6C7A\u7B56\u3067\u3059" }), _jsx("li", { children: "\u2022 \u751F\u6210\u3055\u308C\u305F\u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u4ED6\u4EBA\u306B\u5171\u6709\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044" })] })] })] }) })] })] }) }));
}
