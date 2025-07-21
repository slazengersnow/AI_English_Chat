import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@shared/supabase';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    useEffect(() => {
        const checkToken = async () => {
            const url = window.location.href;
            const searchParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            // Check if we have stored hash from HashHandler
            const storedHash = sessionStorage.getItem('supabase_recovery_hash');
            let storedHashParams = new URLSearchParams();
            if (storedHash) {
                storedHashParams = new URLSearchParams(storedHash.substring(1));
                console.log('Found stored recovery hash:', storedHash);
            }
            // Debug information
            const debug = `
        URL: ${url}
        Search: ${window.location.search}
        Hash: ${window.location.hash}
        Stored Hash: ${storedHash || 'none'}
        Access Token (search): ${searchParams.get('access_token') ? 'present' : 'missing'}
        Access Token (hash): ${hashParams.get('access_token') ? 'present' : 'missing'}
        Access Token (stored): ${storedHashParams.get('access_token') ? 'present' : 'missing'}
        Refresh Token (search): ${searchParams.get('refresh_token') ? 'present' : 'missing'}
        Refresh Token (hash): ${hashParams.get('refresh_token') ? 'present' : 'missing'}
        Refresh Token (stored): ${storedHashParams.get('refresh_token') ? 'present' : 'missing'}
        Type (search): ${searchParams.get('type')}
        Type (hash): ${hashParams.get('type')}
        Type (stored): ${storedHashParams.get('type')}
      `;
            setDebugInfo(debug);
            console.log('Debug info:', debug);
            let accessToken = searchParams.get('access_token') || hashParams.get('access_token') || storedHashParams.get('access_token');
            let refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token') || storedHashParams.get('refresh_token');
            let type = searchParams.get('type') || hashParams.get('type') || storedHashParams.get('type');
            if (accessToken && refreshToken && type === 'recovery') {
                try {
                    console.log('Setting session with tokens...');
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) {
                        console.error('Session error:', error);
                        toast({
                            title: "セッションエラー",
                            description: `パスワードリセットのリンクが無効です: ${error.message}`,
                            variant: "destructive",
                        });
                    }
                    else {
                        console.log('Valid session established');
                        setIsValidToken(true);
                        // Clear stored hash after successful use
                        sessionStorage.removeItem('supabase_recovery_hash');
                    }
                }
                catch (error) {
                    console.error('Token verification error:', error);
                    toast({
                        title: "エラー",
                        description: "パスワードリセットの処理中にエラーが発生しました",
                        variant: "destructive",
                    });
                }
            }
            else {
                console.log('Missing tokens or invalid type');
                toast({
                    title: "無効なリンク",
                    description: "パスワードリセットのリンクが無効です。再度パスワードリセットを実行してください。",
                    variant: "destructive",
                });
            }
        };
        checkToken();
    }, [toast]);
    const handlePasswordUpdate = async (e) => {
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
            const { error } = await supabase.auth.updateUser({
                password: password,
            });
            if (error) {
                toast({
                    title: "パスワード更新エラー",
                    description: error.message,
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "パスワード更新完了",
                    description: "パスワードが正常に更新されました。新しいパスワードでログインしてください。",
                });
                setLocation('/login');
            }
        }
        catch (error) {
            toast({
                title: "エラー",
                description: "パスワード更新中にエラーが発生しました",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleReturnToLogin = () => {
        setLocation('/login');
    };
    if (!isValidToken) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(AlertCircle, { className: "text-red-500 w-8 h-8" }) }), _jsx(CardTitle, { className: "text-2xl", children: "\u30EA\u30F3\u30AF\u304C\u7121\u52B9\u3067\u3059" }), _jsx(CardDescription, { children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8\u306E\u30EA\u30F3\u30AF\u304C\u7121\u52B9\u307E\u305F\u306F\u671F\u9650\u5207\u308C\u3067\u3059" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { children: "\u4EE5\u4E0B\u306E\u7406\u7531\u304C\u8003\u3048\u3089\u308C\u307E\u3059\uFF1A" }), _jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [_jsx("li", { children: "\u30EA\u30F3\u30AF\u306E\u6709\u52B9\u671F\u9650\u304C\u5207\u308C\u3066\u3044\u308B" }), _jsx("li", { children: "\u65E2\u306B\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u5909\u66F4\u3055\u308C\u3066\u3044\u308B" }), _jsx("li", { children: "\u30EA\u30F3\u30AF\u304C\u6B63\u3057\u304F\u30B3\u30D4\u30FC\u3055\u308C\u3066\u3044\u306A\u3044" })] })] }), _jsx(Button, { onClick: handleReturnToLogin, className: "w-full", children: "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8\u306B\u623B\u308B" }), _jsxs("details", { className: "text-xs", children: [_jsx("summary", { className: "cursor-pointer text-gray-500", children: "\u30C7\u30D0\u30C3\u30B0\u60C5\u5831" }), _jsx("pre", { className: "mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto", children: debugInfo })] })] })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Lock, { className: "text-white w-8 h-8" }) }), _jsx(CardTitle, { className: "text-2xl", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8" }), _jsx(CardDescription, { children: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handlePasswordUpdate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "8\u6587\u5B57\u4EE5\u4E0A\u306E\u30D1\u30B9\u30EF\u30FC\u30C9", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u78BA\u8A8D" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u518D\u5165\u529B", className: "pl-10 pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showConfirmPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "更新中..." : "パスワードを更新" })] }), _jsx("div", { className: "mt-6 text-center text-sm", children: _jsx(Button, { variant: "link", className: "text-gray-600 hover:text-gray-800", onClick: handleReturnToLogin, children: "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8\u306B\u623B\u308B" }) })] })] }) }));
}
