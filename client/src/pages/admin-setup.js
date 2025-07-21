import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@shared/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
export default function AdminSetup() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleSetupAccount = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (password !== confirmPassword) {
            toast({
                title: "パスワードエラー",
                description: "パスワードが一致しません",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        if (password.length < 8) {
            toast({
                title: "パスワードエラー",
                description: "パスワードは8文字以上で設定してください",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/confirm`,
                },
            });
            if (error) {
                if (error.message.includes('User already registered')) {
                    toast({
                        title: "アカウント確認",
                        description: "このメールアドレスは既に登録されています。パスワードリセットを試してください。",
                        variant: "destructive",
                    });
                }
                else {
                    toast({
                        title: "登録エラー",
                        description: error.message,
                        variant: "destructive",
                    });
                }
                return;
            }
            if (data.user) {
                toast({
                    title: "アカウント作成完了",
                    description: "確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。",
                });
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "アカウント作成中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/password-reset`,
            });
            console.log('Password reset email sent for:', email);
            if (error) {
                toast({
                    title: "パスワードリセットエラー",
                    description: error.message,
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワードリセットメール送信完了",
                    description: "パスワードリセットの手順をメールで送信しました",
                });
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "パスワードリセット中にエラーが発生しました",
                variant: "destructive",
            });
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-white text-2xl font-bold", children: "\u7BA1\u7406" }) }), _jsx(CardTitle, { className: "text-2xl", children: "\u7BA1\u7406\u8005\u30A2\u30AB\u30A6\u30F3\u30C8\u8A2D\u5B9A" }), _jsx(CardDescription, { children: "\u65B0\u3057\u3044\u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u4F5C\u6210\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSetupAccount, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "bizmowa.com \u307E\u305F\u306F slazengersnow@gmail.com", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "8\u6587\u5B57\u4EE5\u4E0A\u306E\u30D1\u30B9\u30EF\u30FC\u30C9", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u78BA\u8A8D" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u518D\u5165\u529B", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "作成中..." : "アカウント作成" })] }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("div", { className: "text-center", children: _jsx("span", { className: "text-sm text-gray-600", children: "\u307E\u305F\u306F" }) }), _jsx(Button, { variant: "outline", className: "w-full", onClick: handlePasswordReset, children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8" })] }), _jsxs("div", { className: "mt-6 text-sm text-gray-600", children: [_jsx("p", { children: _jsx("strong", { children: "\u4F7F\u7528\u65B9\u6CD5\uFF1A" }) }), _jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [_jsx("li", { children: "\u65B0\u898F\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210: \u5168\u9805\u76EE\u3092\u5165\u529B\u3057\u3066\u300C\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210\u300D" }), _jsx("li", { children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8: \u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306E\u307F\u5165\u529B\u3057\u3066\u300C\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u300D" }), _jsx("li", { children: "\u78BA\u8A8D\u30E1\u30FC\u30EB\u304C\u5C4A\u304B\u306A\u3044\u5834\u5408\u306F\u3001\u8FF7\u60D1\u30E1\u30FC\u30EB\u30D5\u30A9\u30EB\u30C0\u3082\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044" })] })] })] })] }) }));
}
