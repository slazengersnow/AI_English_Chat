import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
export function SubscriptionGuard({ children }) {
    const [, setLocation] = useLocation();
    const { isAdmin } = useAuth();
    const { data: subscription, isLoading, error } = useQuery({
        queryKey: ["/api/user-subscription"],
        retry: false,
    });
    // Admin users bypass subscription checks
    if (isAdmin) {
        return _jsx(_Fragment, { children: children });
    }
    useEffect(() => {
        if (!isLoading && subscription) {
            console.log('SubscriptionGuard - Subscription data:', subscription);
            console.log('SubscriptionGuard - Status:', subscription.subscriptionStatus);
            if (!['active', 'trialing'].includes(subscription.subscriptionStatus || '')) {
                // If no subscription or inactive, redirect to subscription selection
                if (window.location.pathname !== '/subscription/select' &&
                    window.location.pathname !== '/login' &&
                    window.location.pathname !== '/signup' &&
                    window.location.pathname !== '/terms') {
                    console.log('SubscriptionGuard - Redirecting to subscription select');
                    setLocation('/subscription/select');
                }
            }
        }
        else if (!isLoading && !subscription) {
            // If no subscription at all, redirect to login instead of subscription selection
            if (window.location.pathname !== '/subscription/select' &&
                window.location.pathname !== '/login' &&
                window.location.pathname !== '/signup' &&
                window.location.pathname !== '/terms') {
                console.log('SubscriptionGuard - No subscription, redirecting to login');
                setLocation('/login');
            }
        }
    }, [subscription, isLoading, setLocation]);
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" }) }));
    }
    if (error || (!subscription || !['active', 'trialing'].includes(subscription.subscriptionStatus || ''))) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(Lock, { className: "w-12 h-12 mx-auto text-orange-500 mb-4" }), _jsx(CardTitle, { children: "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u304C\u5FC5\u8981\u3067\u3059" })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-gray-600", children: "AI\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8\u3092\u3054\u5229\u7528\u3044\u305F\u3060\u304F\u306B\u306F\u3001\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u304C\u5FC5\u8981\u3067\u3059\u3002" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { variant: "outline", onClick: () => setLocation('/login'), className: "w-full", children: "\u30ED\u30B0\u30A4\u30F3" }), _jsxs(Button, { onClick: () => setLocation('/subscription/select'), className: "w-full", children: [_jsx(CreditCard, { className: "w-4 h-4 mr-2" }), "\u30D7\u30E9\u30F3\u3092\u9078\u629E"] })] })] })] }) }));
    }
    return _jsx(_Fragment, { children: children });
}
