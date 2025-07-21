import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@shared/supabase';
export default function Confirm() {
    const [, setLocation] = useLocation();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    setStatus('error');
                    setMessage('メールアドレスの確認中にエラーが発生しました。');
                    return;
                }
                if (data.session) {
                    setStatus('success');
                    setMessage('メールアドレス認証が完了しました。');
                }
                else {
                    setStatus('error');
                    setMessage('認証セッションが見つかりません。');
                }
            }
            catch (error) {
                setStatus('error');
                setMessage('認証処理中にエラーが発生しました。');
            }
        };
        handleAuthCallback();
    }, []);
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-white text-2xl font-bold", children: "AI" }) }), _jsx(CardTitle, { className: "text-2xl", children: "AI\u77AC\u9593\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8" }), _jsx(CardDescription, { children: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u8A8D\u8A3C" })] }), _jsxs(CardContent, { className: "text-center", children: [status === 'loading' && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" }), _jsx("p", { className: "text-gray-600", children: "\u8A8D\u8A3C\u3092\u78BA\u8A8D\u4E2D..." })] })), status === 'success' && (_jsxs("div", { className: "space-y-4", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-green-500 mx-auto" }), _jsx("h3", { className: "text-lg font-semibold text-green-700", children: "\u8A8D\u8A3C\u5B8C\u4E86" }), _jsx("p", { className: "text-gray-600", children: message }), _jsx("p", { className: "text-sm text-gray-500", children: "\u30ED\u30B0\u30A4\u30F3\u3057\u3066AI\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002" }), _jsx(Button, { onClick: () => setLocation('/login'), className: "w-full", children: "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8\u3078" })] })), status === 'error' && (_jsxs("div", { className: "space-y-4", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-red-500 mx-auto" }), _jsx("h3", { className: "text-lg font-semibold text-red-700", children: "\u8A8D\u8A3C\u30A8\u30E9\u30FC" }), _jsx("p", { className: "text-gray-600", children: message }), _jsx("p", { className: "text-sm text-gray-500", children: "\u65B0\u3057\u3044\u78BA\u8A8D\u30E1\u30FC\u30EB\u3092\u9001\u4FE1\u3059\u308B\u304B\u3001\u30B5\u30DD\u30FC\u30C8\u306B\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\u3002" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: () => setLocation('/signup'), className: "w-full", children: "\u65B0\u898F\u767B\u9332\u306B\u623B\u308B" }), _jsx(Button, { variant: "outline", onClick: () => setLocation('/login'), className: "w-full", children: "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8\u3078" })] })] }))] })] }) }));
}
