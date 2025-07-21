import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PremiumGate({ children, feature = "この機能", showUpgrade = true }) {
    const { canAccessPremiumFeatures, isLoading } = useSubscription();
    if (isLoading) {
        return (_jsx("div", { className: "h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    if (!canAccessPremiumFeatures) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 p-4", children: _jsx("div", { className: "max-w-2xl mx-auto pt-20", children: _jsxs(Card, { className: "text-center", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center", children: _jsx(Crown, { className: "w-8 h-8 text-white" }) }) }), _jsx(CardTitle, { className: "text-2xl mb-2", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u6A5F\u80FD" }), _jsxs(CardDescription, { className: "text-base", children: [feature, "\u306F\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u9650\u5B9A\u3067\u3059\u3002"] })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Lock, { className: "w-5 h-5 text-blue-600 mt-0.5" }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-blue-900 font-medium mb-2", children: "\u3053\u306E\u6A5F\u80FD\u306F\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u9650\u5B9A\u3067\u3059\u3002" }), _jsx("p", { className: "text-blue-800 text-sm", children: "\u30EA\u30A2\u30EB\u306A\u30D3\u30B8\u30CD\u30B9\u30B7\u30FC\u30F3\u3092\u60F3\u5B9A\u3057\u305F\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2\u3092\u4F53\u9A13\u3057\u305F\u3044\u65B9\u306F\u3001\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u3092\u3054\u691C\u8A0E\u304F\u3060\u3055\u3044\u3002" })] })] }) }), showUpgrade && (_jsxs("div", { className: "space-y-4", children: [_jsxs(Button, { className: "w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3", children: [_jsx(Crown, { className: "w-4 h-4 mr-2" }), "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u306B\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9"] }), _jsx(Button, { variant: "outline", className: "w-full", onClick: () => window.history.back(), children: "\u623B\u308B" })] }))] })] }) }) }));
    }
    return _jsx(_Fragment, { children: children });
}
