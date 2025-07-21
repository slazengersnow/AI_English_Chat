import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@shared/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
export default function Signup() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const validatePassword = (password) => {
        if (password.length < 8) {
            return "パスワードは8文字以上である必要があります";
        }
        if (!/[A-Za-z]/.test(password)) {
            return "パスワードに英字を含めてください";
        }
        if (!/[0-9]/.test(password)) {
            return "パスワードに数字を含めてください";
        }
        return null;
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // バリデーション
        if (!agreedToTerms || !agreedToPrivacy) {
            toast({
                title: "登録エラー",
                description: "利用規約とプライバシーポリシーに同意してください",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            toast({
                title: "登録エラー",
                description: "パスワードが一致しません",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
            toast({
                title: "パスワードエラー",
                description: passwordError,
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
                toast({
                    title: "登録エラー",
                    description: error.message === 'User already registered' ?
                        "このメールアドレスは既に登録されています" :
                        error.message,
                    variant: "destructive",
                });
                return;
            }
            if (data.user) {
                toast({
                    title: "登録完了",
                    description: "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
                });
                setLocation('/login');
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "登録中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleGoogleSignup = async () => {
        try {
            const replitUrl = `https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback`;
            console.log('Starting Google OAuth signup with redirect to:', replitUrl);
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: replitUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            console.log('OAuth signup response:', { data, error });
            if (error) {
                console.error('Google OAuth signup error:', error);
                toast({
                    title: "Google登録エラー",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Google OAuth signup exception:', error);
            toast({
                title: "エラー",
                description: "Google登録中にエラーが発生しました",
                variant: "destructive",
            });
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-white text-2xl font-bold", children: "AI" }) }), _jsx(CardTitle, { className: "text-2xl", children: "AI\u77AC\u9593\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8" }), _jsx(CardDescription, { children: "\u65B0\u3057\u3044\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "example@email.com", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u6700\u4F4E8\u6587\u5B57\u3001\u82F1\u5B57\u3068\u6570\u5B57\u3092\u542B\u3080", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u78BA\u8A8D" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u518D\u5165\u529B", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "terms", checked: agreedToTerms, onCheckedChange: (checked) => setAgreedToTerms(checked) }), _jsxs(Label, { htmlFor: "terms", className: "text-sm", children: [_jsx("a", { href: "/terms", target: "_blank", className: "text-blue-600 hover:underline", children: "\u5229\u7528\u898F\u7D04" }), "\u306B\u540C\u610F\u3057\u307E\u3059"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "privacy", checked: agreedToPrivacy, onCheckedChange: (checked) => setAgreedToPrivacy(checked) }), _jsxs(Label, { htmlFor: "privacy", className: "text-sm", children: [_jsx("a", { href: "/privacy", target: "_blank", className: "text-blue-600 hover:underline", children: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC" }), "\u306B\u540C\u610F\u3057\u307E\u3059"] })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "登録中..." : "アカウント作成" })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("span", { className: "w-full border-t" }) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-white px-2 text-muted-foreground", children: "\u307E\u305F\u306F" }) })] }), _jsxs(Button, { type: "button", variant: "outline", className: "w-full mt-4", onClick: handleGoogleSignup, children: [_jsxs("svg", { className: "w-4 h-4 mr-2", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Google\u3067\u767B\u9332"] })] }), _jsxs("div", { className: "mt-6 text-center text-sm", children: [_jsx("span", { className: "text-gray-600", children: "\u65E2\u306B\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u304A\u6301\u3061\u306E\u65B9\u306F" }), _jsx(Button, { variant: "link", className: "p-0 ml-1 h-auto", onClick: () => setLocation('/login'), children: "\u30ED\u30B0\u30A4\u30F3" })] })] })] }) }));
}
