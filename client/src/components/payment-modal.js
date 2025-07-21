import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { X, Check, Crown, Star } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
export function PaymentModal({ isOpen, onClose }) {
    const [selectedPlan, setSelectedPlan] = useState("premium_monthly");
    const [checkoutOpened, setCheckoutOpened] = useState(false);
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ["/api/subscription-plans"],
        enabled: isOpen,
    });
    const createCheckoutSessionMutation = useMutation({
        mutationFn: async (priceId) => {
            const response = await apiRequest("POST", "/api/create-checkout-session", {
                priceId,
                successUrl: window.location.origin + "/success",
                cancelUrl: window.location.origin + "/cancel",
            });
            return response.json();
        },
        onSuccess: (data) => {
            // Open Stripe Checkout in new tab
            window.open(data.url, "_blank");
            setCheckoutOpened(true);
        },
    });
    const handleUpgrade = () => {
        if (plans && selectedPlan) {
            const plan = plans[selectedPlan];
            if (plan) {
                createCheckoutSessionMutation.mutate(plan.priceId);
            }
        }
    };
    if (!isOpen)
        return null;
    if (plansLoading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-2xl max-w-md w-full p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "\u30D7\u30E9\u30F3\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." })] }) }) }));
    }
    const plansData = plans;
    const selectedPlanData = plansData?.[selectedPlan];
    // Show checkout opened confirmation
    if (checkoutOpened) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full p-6 text-center", children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "\u6C7A\u6E08\u753B\u9762\u3092\u958B\u304D\u307E\u3057\u305F" }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["\u65B0\u3057\u3044\u30BF\u30D6\u3067Stripe\u6C7A\u6E08\u753B\u9762\u304C\u958B\u304D\u307E\u3057\u305F\u3002", _jsx("br", {}), "\u6C7A\u6E08\u3092\u5B8C\u4E86\u3057\u3066\u3053\u3061\u3089\u306E\u30DA\u30FC\u30B8\u306B\u304A\u623B\u308A\u304F\u3060\u3055\u3044\u3002"] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3", children: [_jsx("p", { className: "text-sm text-blue-800 mb-1", children: _jsx("strong", { children: "\u6C7A\u6E08\u5B8C\u4E86\u5F8C\u306E\u6D41\u308C\uFF1A" }) }), _jsxs("p", { className: "text-sm text-blue-700", children: ["\u6C7A\u6E08\u304C\u5B8C\u4E86\u3059\u308B\u3068\u81EA\u52D5\u7684\u306B\u3053\u3061\u3089\u306E\u30DA\u30FC\u30B8\u306B\u623B\u308A\u3001", _jsx("br", {}), "\u3059\u3050\u306B\u30D7\u30EC\u30DF\u30A2\u30E0\u6A5F\u80FD\u3092\u3054\u5229\u7528\u3044\u305F\u3060\u3051\u307E\u3059\u3002"] })] }), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-3", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: _jsx("strong", { children: "\u65B0\u3057\u3044\u30BF\u30D6\u304C\u958B\u304B\u306A\u3044\u5834\u5408\uFF1A" }) }), _jsxs("p", { className: "text-sm text-gray-500", children: ["\u30D6\u30E9\u30A6\u30B6\u306E\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u30D6\u30ED\u30C3\u30AF\u3092\u89E3\u9664\u3057\u3066\u304B\u3089", _jsx("br", {}), "\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"] })] })] }), _jsxs("div", { className: "mt-6 flex gap-3", children: [_jsx(Button, { onClick: () => setCheckoutOpened(false), variant: "outline", className: "flex-1", children: "\u623B\u308B" }), _jsx(Button, { onClick: onClose, className: "flex-1", children: "\u9589\u3058\u308B" })] })] }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full p-6 animate-bounce-in max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Crown, { className: "w-6 h-6 text-purple-600" }), _jsx("h3", { className: "text-xl font-bold text-gray-900", children: "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "p-1 rounded-full hover:bg-gray-100", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "space-y-3 mb-6", children: plansData &&
                        Object.entries(plansData).map(([key, plan]) => {
                            const isPremium = key.includes("premium");
                            const isYearly = key.includes("yearly");
                            const isUpgrade = key.includes("upgrade");
                            if (isUpgrade)
                                return null; // Hide upgrade option for now
                            return (_jsxs("div", { className: `p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === key
                                    ? "border-purple-600 bg-purple-50"
                                    : "border-gray-200 hover:border-gray-300"}`, onClick: () => setSelectedPlan(key), children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === key
                                                        ? "border-purple-600 bg-purple-600"
                                                        : "border-gray-300"}`, children: selectedPlan === key && (_jsx(Check, { className: "w-3 h-3 text-white" })) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [isPremium ? (_jsx(Crown, { className: "w-4 h-4 text-purple-600" })) : (_jsx(Star, { className: "w-4 h-4 text-blue-600" })), _jsx("h4", { className: "font-semibold text-gray-900", children: plan.name }), isYearly && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium", children: "\u304A\u5F97" }))] }), _jsx("p", { className: "text-sm text-gray-600", children: plan.price })] })] }) }), _jsx("div", { className: "mt-3 pl-8", children: _jsx("ul", { className: "text-sm text-gray-600 space-y-1", children: plan.features.map((feature, index) => (_jsxs("li", { className: "flex items-center space-x-2", children: [_jsx(Check, { className: "w-3 h-3 text-green-500" }), _jsx("span", { children: feature })] }, index))) }) })] }, key));
                        }) }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("p", { className: "text-gray-600 text-sm", children: "\u9078\u629E\u3057\u305F\u30D7\u30E9\u30F3\u3067AI\u82F1\u4F5C\u6587\u5B66\u7FD2\u3092\u59CB\u3081\u307E\u3057\u3087\u3046" }), selectedPlanData && (_jsxs("div", { className: "mt-4 p-4 bg-gray-50 rounded-xl", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "\u9078\u629E\u4E2D\u306E\u30D7\u30E9\u30F3" }), _jsx("p", { className: "text-lg font-bold text-purple-600", children: selectedPlanData.name }), _jsx("p", { className: "text-sm text-gray-600", children: selectedPlanData.price }), _jsx("div", { className: "text-xs text-purple-600 mt-2", children: "7\u65E5\u9593\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB\u4ED8\u304D" })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Button, { onClick: handleUpgrade, disabled: createCheckoutSessionMutation.isPending || !selectedPlanData, className: "w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium", children: createCheckoutSessionMutation.isPending ? (_jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "\u51E6\u7406\u4E2D..." })] })) : ("7日間無料で始める") }), _jsx(Button, { onClick: onClose, variant: "outline", className: "w-full", children: "\u5F8C\u3067\u691C\u8A0E\u3059\u308B" })] }), _jsx("p", { className: "text-xs text-gray-500 text-center mt-4", children: "\u30C8\u30E9\u30A4\u30A2\u30EB\u671F\u9593\u4E2D\u306F\u3044\u3064\u3067\u3082\u30AD\u30E3\u30F3\u30BB\u30EB\u53EF\u80FD\u3067\u3059\u3002" })] }) }));
}
