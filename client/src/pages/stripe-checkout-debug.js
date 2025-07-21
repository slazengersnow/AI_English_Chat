import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
export default function StripeCheckoutDebug() {
    const [checkoutUrl, setCheckoutUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState({});
    useEffect(() => {
        const info = {
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            javaScriptEnabled: true,
            currentUrl: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
        };
        setDebugInfo(info);
    }, []);
    const createCheckoutSession = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: 'price_1ReXPnHridtc6DvMQaW7NC6w',
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/payment-cancelled`
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout session');
            }
            console.log('Checkout session created:', data);
            setCheckoutUrl(data.url);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Checkout error:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const openCheckoutInNewTab = () => {
        if (checkoutUrl) {
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        }
    };
    const redirectToCheckout = () => {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs(Card, { className: "mb-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Stripe Checkout Debug" }), _jsx(CardDescription, { children: "Stripe\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30DA\u30FC\u30B8\u306E\u8868\u793A\u554F\u984C\u3092\u8A3A\u65AD\u30FB\u4FEE\u6B63" })] }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold", children: "\u74B0\u5883\u60C5\u5831" }), Object.entries(debugInfo).map(([key, value]) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-gray-600", children: [key, ":"] }), _jsx("span", { className: "text-gray-800 font-mono max-w-xs truncate", children: typeof value === 'string' ? value : JSON.stringify(value) })] }, key)))] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold", children: "\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30C6\u30B9\u30C8" }), _jsx(Button, { onClick: createCheckoutSession, disabled: isLoading, className: "w-full", children: isLoading ? "セッション作成中..." : "チェックアウトセッションを作成" }), error && (_jsxs(Alert, { className: "border-red-200", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-red-700", children: error })] })), checkoutUrl && (_jsxs("div", { className: "space-y-3", children: [_jsxs(Alert, { className: "border-green-200", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-green-700", children: "\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8URL\u304C\u6B63\u5E38\u306B\u4F5C\u6210\u3055\u308C\u307E\u3057\u305F" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { onClick: openCheckoutInNewTab, variant: "outline", className: "w-full", children: [_jsx(ExternalLink, { className: "w-4 h-4 mr-2" }), "\u65B0\u3057\u3044\u30BF\u30D6\u3067\u958B\u304F\uFF08\u63A8\u5968\uFF09"] }), _jsx(Button, { onClick: redirectToCheckout, className: "w-full", children: "\u3053\u306E\u30DA\u30FC\u30B8\u3067\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8" })] }), _jsx("div", { className: "text-xs text-gray-500 font-mono p-2 bg-gray-100 rounded", children: checkoutUrl })] }))] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u3088\u304F\u3042\u308B\u554F\u984C\u3068\u89E3\u6C7A\u7B56" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-yellow-50 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-yellow-800 mb-2", children: "\u554F\u984C\uFF1A\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30DA\u30FC\u30B8\u304C\u5F71\u306E\u3088\u3046\u306B\u898B\u3048\u308B" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u30D6\u30E9\u30A6\u30B6\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u8A2D\u5B9A\u3067iframe\u304C\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u308B" }), _jsx("li", { children: "\u2022 JavaScript\u304C\u7121\u52B9\u5316\u3055\u308C\u3066\u3044\u308B" }), _jsx("li", { children: "\u2022 \u5E83\u544A\u30D6\u30ED\u30C3\u30AB\u30FC\u304CStripe\u306E\u30B9\u30AF\u30EA\u30D7\u30C8\u3092\u30D6\u30ED\u30C3\u30AF\u3057\u3066\u3044\u308B" }), _jsx("li", { children: "\u2022 Cookie\u3084LocalStorage\u304C\u7121\u52B9\u5316\u3055\u308C\u3066\u3044\u308B" })] })] }), _jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-blue-800 mb-2", children: "\u89E3\u6C7A\u7B56" }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u65B0\u3057\u3044\u30BF\u30D6\u3067\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30DA\u30FC\u30B8\u3092\u958B\u304F" }), _jsx("li", { children: "\u2022 \u5E83\u544A\u30D6\u30ED\u30C3\u30AB\u30FC\u3092\u4E00\u6642\u7684\u306B\u7121\u52B9\u5316" }), _jsx("li", { children: "\u2022 \u30D7\u30E9\u30A4\u30D9\u30FC\u30C8/\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u30E2\u30FC\u30C9\u3092\u8A66\u3059" }), _jsx("li", { children: "\u2022 \u5225\u306E\u30D6\u30E9\u30A6\u30B6\u3092\u4F7F\u7528" })] })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-green-800 mb-2", children: "\u30C6\u30B9\u30C8\u624B\u9806" }), _jsxs("ol", { className: "text-sm text-green-700 space-y-1", children: [_jsx("li", { children: "1. \u4E0A\u8A18\u306E\u30DC\u30BF\u30F3\u3067\u30C1\u30A7\u30C3\u30AF\u30A2\u30A6\u30C8\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4F5C\u6210" }), _jsx("li", { children: "2. \u300C\u65B0\u3057\u3044\u30BF\u30D6\u3067\u958B\u304F\u300D\u3092\u9078\u629E" }), _jsx("li", { children: "3. \u65B0\u3057\u3044\u30BF\u30D6\u3067Stripe\u30DA\u30FC\u30B8\u304C\u6B63\u5E38\u306B\u8868\u793A\u3055\u308C\u308B\u3053\u3068\u3092\u78BA\u8A8D" }), _jsx("li", { children: "4. \u6C7A\u6E08\u60C5\u5831\u5165\u529B\u753B\u9762\u304C\u8868\u793A\u3055\u308C\u308C\u3070\u6210\u529F" })] })] })] }) })] })] }) }));
}
