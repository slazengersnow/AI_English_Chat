import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
export default function SubscriptionSelect() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [checkoutOpened, setCheckoutOpened] = useState(false);
    const { toast } = useToast();
    const [plans, setPlans] = useState([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    // Load subscription plans from server
    useEffect(() => {
        const loadPlans = async () => {
            try {
                const response = await fetch('/api/subscription-plans');
                const planData = await response.json();
                const formattedPlans = [
                    {
                        priceId: planData.standard_monthly.priceId,
                        name: "スタンダード",
                        price: "980",
                        period: "月",
                        features: [
                            "月額980円",
                            "基本練習機能（全レベル対応）",
                            "1日50問まで",
                            "詳しい解説・類似フレーズ",
                            "基本的な進捗管理"
                        ]
                    },
                    {
                        priceId: planData.premium_monthly.priceId,
                        name: "プレミアム",
                        price: "1,300",
                        period: "月",
                        features: [
                            "月額1,300円",
                            "基本練習機能（全レベル対応）",
                            "1日100問まで",
                            "詳しい解説・類似フレーズ",
                            "カスタムシナリオ作成",
                            "復習機能"
                        ],
                        popular: true
                    },
                    {
                        priceId: planData.standard_yearly.priceId,
                        name: "スタンダード年間",
                        price: "9,800",
                        period: "年",
                        features: [
                            "年会費9,800円（2ヶ月無料）",
                            "基本練習機能（全レベル対応）",
                            "1日50問まで",
                            "詳しい解説・類似フレーズ",
                            "基本的な進捗管理"
                        ],
                        savings: "月額比較で2ヶ月分お得"
                    },
                    {
                        priceId: planData.premium_yearly.priceId,
                        name: "プレミアム年間",
                        price: "13,000",
                        period: "年",
                        features: [
                            "年会費13,000円（2ヶ月無料）",
                            "基本練習機能（全レベル対応）",
                            "1日100問まで",
                            "詳しい解説・類似フレーズ",
                            "カスタムシナリオ作成",
                            "復習機能"
                        ],
                        savings: "月額比較で2ヶ月分お得"
                    }
                ];
                setPlans(formattedPlans);
            }
            catch (error) {
                console.error('Failed to load plans:', error);
                toast({
                    title: "エラー",
                    description: "プラン情報の取得に失敗しました。",
                    variant: "destructive"
                });
            }
            finally {
                setIsLoadingPlans(false);
            }
        };
        loadPlans();
    }, [toast]);
    const createCheckoutMutation = useMutation({
        mutationFn: async (priceId) => {
            const origin = window.location.origin;
            const response = await apiRequest("POST", "/api/create-checkout-session", {
                priceId,
                successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${origin}/payment-cancelled`
            });
            return response.json();
        },
        onSuccess: (data) => {
            console.log('Checkout session created:', data);
            // 新しいタブでチェックアウトページを開く（推奨）
            const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                // ポップアップがブロックされた場合は現在のウィンドウで開く
                window.location.href = data.url;
            }
            else {
                // 新しいタブで開いた場合は確認画面を表示
                setCheckoutOpened(true);
            }
        },
        onError: (error) => {
            console.error('Checkout error:', error);
            toast({
                title: "エラー",
                description: "決済画面の作成に失敗しました。ページを再読み込みして再度お試しください。",
                variant: "destructive"
            });
        }
    });
    const handlePlanSelect = (priceId) => {
        setSelectedPlan(priceId);
        createCheckoutMutation.mutate(priceId);
    };
    // Show checkout opened confirmation
    if (checkoutOpened) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-lg w-full p-8 text-center shadow-xl", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-10 h-10 text-green-600" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-3", children: "\u6C7A\u6E08\u753B\u9762\u3092\u958B\u304D\u307E\u3057\u305F" }), _jsxs("p", { className: "text-gray-600 mb-6", children: ["\u65B0\u3057\u3044\u30BF\u30D6\u3067Stripe\u6C7A\u6E08\u753B\u9762\u304C\u958B\u304D\u307E\u3057\u305F\u3002", _jsx("br", {}), "\u6C7A\u6E08\u3092\u5B8C\u4E86\u3057\u3066\u3053\u3061\u3089\u306E\u30DA\u30FC\u30B8\u306B\u304A\u623B\u308A\u304F\u3060\u3055\u3044\u3002"] })] }), _jsxs("div", { className: "space-y-4 mb-6", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-blue-800 mb-2 font-semibold", children: "\u6C7A\u6E08\u5B8C\u4E86\u5F8C\u306E\u6D41\u308C\uFF1A" }), _jsxs("p", { className: "text-sm text-blue-700", children: ["\u6C7A\u6E08\u304C\u5B8C\u4E86\u3059\u308B\u3068\u81EA\u52D5\u7684\u306B\u6210\u529F\u30DA\u30FC\u30B8\u306B\u79FB\u52D5\u3057\u3001", _jsx("br", {}), "\u3059\u3050\u306B\u30D7\u30EC\u30DF\u30A2\u30E0\u6A5F\u80FD\u3092\u3054\u5229\u7528\u3044\u305F\u3060\u3051\u307E\u3059\u3002"] })] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-yellow-800 mb-2 font-semibold", children: "\u65B0\u3057\u3044\u30BF\u30D6\u304C\u958B\u304B\u306A\u3044\u5834\u5408\uFF1A" }), _jsxs("p", { className: "text-sm text-yellow-700", children: ["\u30D6\u30E9\u30A6\u30B6\u306E\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u30D6\u30ED\u30C3\u30AF\u304C\u6709\u52B9\u306B\u306A\u3063\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002", _jsx("br", {}), "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u3092\u8A31\u53EF\u3057\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { onClick: () => setCheckoutOpened(false), variant: "outline", className: "flex-1", children: "\u30D7\u30E9\u30F3\u9078\u629E\u306B\u623B\u308B" }), _jsx(Button, { onClick: () => window.location.href = '/', className: "flex-1", children: "\u30C8\u30C3\u30D7\u30DA\u30FC\u30B8\u306B\u623B\u308B" })] })] }) }));
    }
    if (isLoadingPlans) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "\u30D7\u30E9\u30F3\u60C5\u5831\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "\u30D7\u30E9\u30F3\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "AI\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8\u3067\u82F1\u8A9E\u529B\u3092\u5411\u4E0A\u3055\u305B\u307E\u3057\u3087\u3046" }), _jsxs("div", { className: "inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full", children: [_jsx(Star, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: "7\u65E5\u9593\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB" })] })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6", children: plans.map((plan, index) => (_jsxs(Card, { className: `relative cursor-pointer transition-all duration-300 hover:shadow-lg ${plan.popular ? 'ring-2 ring-purple-500' : ''} ${selectedPlan === plan.priceId ? 'ring-2 ring-blue-500' : ''}`, onClick: () => handlePlanSelect(plan.priceId), children: [plan.popular && (_jsx(Badge, { className: "absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600", children: "\u4EBA\u6C17" })), _jsxs(CardHeader, { className: "text-center", children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [plan.name === "プレミアム" ? (_jsx(Crown, { className: "w-6 h-6 text-purple-600 mr-2" })) : (_jsx(Star, { className: "w-6 h-6 text-blue-600 mr-2" })), _jsx(CardTitle, { className: "text-xl", children: plan.name })] }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: "text-3xl font-bold", children: ["\u00A5", plan.price.toLocaleString()] }), _jsxs("span", { className: "text-gray-600", children: ["/", plan.period] })] }), plan.savings && (_jsx("div", { className: "mt-2", children: _jsx(Badge, { className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-3 py-1", children: plan.savings }) }))] }), _jsxs(CardContent, { children: [_jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map((feature, featureIndex) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Check, { className: "w-4 h-4 text-green-600 flex-shrink-0" }), _jsx("span", { className: "text-sm text-gray-700", children: feature })] }, featureIndex))) }), _jsx(Button, { className: `w-full ${plan.popular
                                            ? 'bg-purple-600 hover:bg-purple-700'
                                            : 'bg-blue-600 hover:bg-blue-700'}`, disabled: createCheckoutMutation.isPending && selectedPlan === plan.priceId, children: createCheckoutMutation.isPending && selectedPlan === plan.priceId
                                            ? "処理中..."
                                            : "7日間無料で開始" })] })] }, index))) }), _jsxs("div", { className: "text-center mt-12", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: [_jsx("p", { className: "text-blue-800 font-semibold mb-2", children: "\u2699\uFE0F \u4FA1\u683C\u8A2D\u5B9A\u306B\u3064\u3044\u3066" }), _jsxs("p", { className: "text-blue-700 text-sm mb-2", children: ["\u4FA1\u683CID\u306E\u8A2D\u5B9A\u3084\u78BA\u8A8D\u306F", _jsx("a", { href: "/price-setup", className: "text-blue-600 hover:underline mx-1 font-semibold", children: "\u4FA1\u683C\u8A2D\u5B9A\u30DA\u30FC\u30B8" }), "\u304B\u3089\u884C\u3048\u307E\u3059\u3002"] }), _jsx("p", { className: "text-blue-700 text-xs", children: "price_\u3067\u59CB\u307E\u308B\u6B63\u3057\u3044\u4FA1\u683CID\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002" })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: "\u203B 7\u65E5\u9593\u306E\u30C8\u30E9\u30A4\u30A2\u30EB\u671F\u9593\u4E2D\u306F\u3044\u3064\u3067\u3082\u30AD\u30E3\u30F3\u30BB\u30EB\u53EF\u80FD\u3067\u3059" }), _jsx("p", { className: "text-xs text-gray-500 mb-4", children: "\u203B \u6D88\u8CBB\u7A0E\u8FBC\u307F" }), _jsxs("p", { className: "text-xs text-gray-500 mb-4", children: ["\u3054\u5229\u7528\u306B\u306F", _jsx("a", { href: "/terms", className: "text-blue-600 hover:underline mx-1", children: "\u5229\u7528\u898F\u7D04" }), "\u3078\u306E\u540C\u610F\u304C\u5FC5\u8981\u3067\u3059"] })] })] }) }));
}
