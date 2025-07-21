import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
export default function PaymentSuccess() {
    const [, setLocation] = useLocation();
    const [sessionId, setSessionId] = useState(null);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
    const [subscriptionCreated, setSubscriptionCreated] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        console.log('PaymentSuccess component mounted');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        console.log('Extracted session ID:', sessionId);
        setSessionId(sessionId);
    }, []);
    const createSubscription = async () => {
        if (!sessionId) {
            toast({
                title: "エラー",
                description: "セッションIDが見つかりません",
                variant: "destructive"
            });
            return;
        }
        setIsCreatingSubscription(true);
        try {
            const response = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    priceId: 'price_1ReXHSHridtc6DvMOjCbo2VK' // Standard monthly - will be determined by session
                })
            });
            const data = await response.json();
            if (response.ok) {
                setSubscriptionCreated(true);
                toast({
                    title: "サブスクリプション作成完了",
                    description: `${data.subscriptionType} プランが有効になりました`,
                    duration: 3000
                });
            }
            else {
                toast({
                    title: "エラー",
                    description: data.message || "サブスクリプションの作成に失敗しました",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Subscription creation error:', error);
            toast({
                title: "エラー",
                description: "サブスクリプションの作成中にエラーが発生しました",
                variant: "destructive"
            });
        }
        finally {
            setIsCreatingSubscription(false);
        }
    };
    const handleGoHome = () => {
        setLocation('/');
    };
    const handleGoToApp = () => {
        if (!subscriptionCreated) {
            createSubscription();
        }
        else {
            setLocation('/');
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md text-center", children: [_jsxs(CardHeader, { className: "pb-4", children: [_jsx("div", { className: "mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }) }), _jsx(CardTitle, { className: "text-2xl text-green-800", children: "\u6C7A\u6E08\u5B8C\u4E86" }), _jsx(CardDescription, { className: "text-green-700", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u3078\u306E\u767B\u9332\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg p-4 border border-green-200", children: [_jsx("h3", { className: "font-semibold mb-2 text-green-800", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u306E\u7279\u5178" }), _jsxs("ul", { className: "text-sm text-green-700 space-y-1 text-left", children: [_jsx("li", { children: "\u2022 \u7121\u5236\u9650\u306E\u554F\u984C\u7DF4\u7FD2" }), _jsx("li", { children: "\u2022 \u30AB\u30B9\u30BF\u30E0\u30B7\u30CA\u30EA\u30AA\u4F5C\u6210" }), _jsx("li", { children: "\u2022 \u8A73\u7D30\u306A\u5B66\u7FD2\u5206\u6790" }), _jsx("li", { children: "\u2022 \u5FA9\u7FD2\u6A5F\u80FD" }), _jsx("li", { children: "\u2022 \u512A\u5148\u30B5\u30DD\u30FC\u30C8" })] })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4 border border-blue-200", children: [_jsx("h3", { className: "font-semibold mb-2 text-blue-800", children: "7\u65E5\u9593\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB" }), _jsx("p", { className: "text-sm text-blue-700", children: "\u4ECA\u3059\u3050\u5168\u3066\u306E\u6A5F\u80FD\u3092\u304A\u8A66\u3057\u3044\u305F\u3060\u3051\u307E\u3059\u3002 \u30C8\u30E9\u30A4\u30A2\u30EB\u671F\u9593\u4E2D\u306F\u3044\u3064\u3067\u3082\u30AD\u30E3\u30F3\u30BB\u30EB\u53EF\u80FD\u3067\u3059\u3002" })] }), sessionId && (_jsxs("div", { className: "text-xs text-gray-500 font-mono", children: ["\u30BB\u30C3\u30B7\u30E7\u30F3ID: ", sessionId] })), _jsxs("div", { className: "space-y-3", children: [!subscriptionCreated && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4", children: [_jsx("p", { className: "text-sm text-yellow-800 mb-2", children: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u8A2D\u5B9A\u3092\u5B8C\u4E86\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx(Button, { onClick: createSubscription, disabled: isCreatingSubscription, className: "w-full bg-yellow-600 hover:bg-yellow-700", children: isCreatingSubscription ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }), "\u8A2D\u5B9A\u4E2D..."] })) : ('サブスクリプションを設定') })] })), _jsx(Button, { onClick: handleGoToApp, className: "w-full bg-green-600 hover:bg-green-700", disabled: !subscriptionCreated, children: subscriptionCreated ? '学習を開始する' : 'サブスクリプション設定後に利用可能' }), _jsxs(Button, { onClick: handleGoHome, variant: "outline", className: "w-full", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\u30DB\u30FC\u30E0\u306B\u623B\u308B"] })] })] })] }) }));
}
