import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '@shared/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export default function DebugAuth() {
    const [debugInfo, setDebugInfo] = useState({});
    useEffect(() => {
        const getCurrentUrl = () => {
            const currentUrl = window.location.origin;
            const replitUrl = `https://${import.meta.env.VITE_REPL_ID || 'ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d'}.replit.app`;
            setDebugInfo({
                currentUrl,
                replitUrl,
                supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
                redirectUrl: `${currentUrl}/auth/callback`,
                replitRedirectUrl: `${replitUrl}/auth/callback`,
            });
        };
        getCurrentUrl();
    }, []);
    const testGoogleAuth = async () => {
        try {
            console.log('Testing Google OAuth with debug info:', debugInfo);
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: debugInfo.replitRedirectUrl,
                },
            });
            console.log('OAuth test result:', { data, error });
        }
        catch (error) {
            console.error('OAuth test error:', error);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-100 p-4", children: _jsxs(Card, { className: "max-w-2xl mx-auto", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\u8A8D\u8A3C\u30C7\u30D0\u30C3\u30B0\u60C5\u5831" }), _jsx(CardDescription, { children: "Google OAuth\u8A8D\u8A3C\u306E\u30C7\u30D0\u30C3\u30B0\u60C5\u5831" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "\u73FE\u5728\u306EURL:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.currentUrl })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Replit URL:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.replitUrl })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Supabase URL:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.supabaseUrl })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Supabase Key:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.hasSupabaseKey ? '設定済み' : '未設定' })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URL:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.redirectUrl })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Replit\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URL:" }), _jsx("p", { className: "text-sm text-gray-600", children: debugInfo.replitRedirectUrl })] }), _jsx("div", { className: "pt-4", children: _jsx(Button, { onClick: testGoogleAuth, className: "w-full", children: "Google\u8A8D\u8A3C\u30C6\u30B9\u30C8" }) }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { children: _jsx("strong", { children: "Google Console\u3067\u8A2D\u5B9A\u3059\u3079\u304D\u9805\u76EE\uFF1A" }) }), _jsxs("ul", { className: "list-disc pl-5 mt-2", children: [_jsx("li", { children: "\u627F\u8A8D\u6E08\u307F\u306EJavaScript\u751F\u6210\u5143: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app" }), _jsx("li", { children: "\u627F\u8A8D\u6E08\u307F\u306E\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URI: https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/callback" })] }), _jsx("p", { className: "mt-4", children: _jsx("strong", { children: "Supabase\u3067\u8A2D\u5B9A\u3059\u3079\u304D\u9805\u76EE\uFF1A" }) }), _jsxs("ul", { className: "list-disc pl-5 mt-2", children: [_jsx("li", { children: "Site URL: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app" }), _jsx("li", { children: "Redirect URLs: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d.replit.app/auth/callback" })] })] })] }) })] }) }));
}
