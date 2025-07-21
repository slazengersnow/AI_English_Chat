import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Save, RefreshCw, Settings, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function PlanConfiguration() {
    const [plans, setPlans] = useState([
        {
            id: 'standard_monthly',
            name: 'スタンダード月額',
            displayPrice: '¥980',
            currentPriceId: 'prod_SZgeMcEAMDMlDe',
            newPriceId: '',
            stripeAmount: 980,
            currency: 'jpy',
            period: 'month',
            features: ['基本練習機能', '1日100問まで', '基本的な評価機能', '進捗記録', 'ブックマーク機能'],
            description: '基本的な英作文練習に最適なプラン',
            verified: false
        },
        {
            id: 'standard_yearly',
            name: 'スタンダード年額',
            displayPrice: '¥9,800',
            currentPriceId: 'prod_SZglW626p1IFsh',
            newPriceId: '',
            stripeAmount: 9800,
            currency: 'jpy',
            period: 'year',
            features: ['基本練習機能', '1日100問まで', '基本的な評価機能', '進捗記録', 'ブックマーク機能', '2ヶ月分お得'],
            description: '年間契約でお得に基本機能を利用',
            verified: false
        },
        {
            id: 'premium_monthly',
            name: 'プレミアム月額',
            displayPrice: '¥1,300',
            currentPriceId: 'price_1ReXPnHridtc6DvMQaW7NC6w',
            newPriceId: '',
            stripeAmount: 1300,
            currency: 'jpy',
            period: 'month',
            features: ['無制限問題', 'カスタムシナリオ作成', '詳細な分析機能', '復習機能', '優先サポート'],
            description: '全機能を利用できるプレミアムプラン',
            verified: false
        },
        {
            id: 'premium_yearly',
            name: 'プレミアム年額',
            displayPrice: '¥13,000',
            currentPriceId: 'prod_SZgnjreCBit2Bj',
            newPriceId: '',
            stripeAmount: 13000,
            currency: 'jpy',
            period: 'year',
            features: ['無制限問題', 'カスタムシナリオ作成', '詳細な分析機能', '復習機能', '優先サポート', '2ヶ月分お得'],
            description: '年間契約でプレミアム機能をお得に利用',
            verified: false
        }
    ]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [availablePrices, setAvailablePrices] = useState([]);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const { toast } = useToast();
    const verifyPriceId = async (planId, priceId) => {
        if (!priceId.trim())
            return;
        try {
            const response = await fetch('/api/stripe/price-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: priceId.trim() })
            });
            const data = await response.json();
            if (response.ok) {
                setPlans(prev => prev.map(plan => plan.id === planId
                    ? { ...plan, verified: true, verificationResult: data }
                    : plan));
                toast({
                    title: "価格ID確認完了",
                    description: `${data.unit_amount} ${data.currency.toUpperCase()} として確認されました`
                });
            }
            else {
                setPlans(prev => prev.map(plan => plan.id === planId
                    ? { ...plan, verified: false, verificationResult: null }
                    : plan));
                toast({
                    title: "価格ID確認失敗",
                    description: data.message,
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Price verification error:', error);
            toast({
                title: "エラー",
                description: "価格IDの確認に失敗しました",
                variant: "destructive"
            });
        }
    };
    const updatePriceId = (planId, newPriceId) => {
        setPlans(prev => prev.map(plan => plan.id === planId
            ? { ...plan, newPriceId, verified: false, verificationResult: null }
            : plan));
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    const saveConfiguration = async () => {
        setIsUpdating(true);
        try {
            const configData = plans.reduce((acc, plan) => {
                if (plan.newPriceId && plan.verified) {
                    acc[plan.id] = {
                        priceId: plan.newPriceId,
                        name: plan.name,
                        displayPrice: plan.displayPrice,
                        stripeAmount: plan.stripeAmount,
                        currency: plan.currency,
                        period: plan.period
                    };
                }
                return acc;
            }, {});
            const response = await fetch('/api/plan-configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plans: configData })
            });
            const result = await response.json();
            if (response.ok) {
                toast({
                    title: "設定保存完了",
                    description: `${result.updated_count}個のプランが正常に更新されました`
                });
            }
            else {
                throw new Error(result.message);
            }
        }
        catch (error) {
            toast({
                title: "保存エラー",
                description: error instanceof Error ? error.message : "設定の保存に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const formatPrice = (amount, currency) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };
    const loadAvailablePrices = async () => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch('/api/stripe-prices');
            const data = await response.json();
            if (response.ok) {
                setAvailablePrices(data.prices || []);
                toast({
                    title: "価格一覧取得完了",
                    description: `${data.prices.length}個の価格を取得しました`
                });
            }
            else {
                throw new Error(data.message);
            }
        }
        catch (error) {
            toast({
                title: "価格取得エラー",
                description: error instanceof Error ? error.message : "価格一覧の取得に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsLoadingPrices(false);
        }
    };
    const selectPriceId = (planId, priceId) => {
        updatePriceId(planId, priceId);
        verifyPriceId(planId, priceId);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-4", children: "\u30D7\u30E9\u30F3\u4FA1\u683CID\u8A2D\u5B9A" }), _jsx("p", { className: "text-gray-600 mb-4", children: "\u5404\u30D7\u30E9\u30F3\u306E\u6B63\u3057\u3044\u4FA1\u683CID\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx(Button, { onClick: loadAvailablePrices, disabled: isLoadingPrices, variant: "outline", className: "mb-4", children: isLoadingPrices ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }), "\u53D6\u5F97\u4E2D..."] })) : (_jsxs(_Fragment, { children: [_jsx(Settings, { className: "w-4 h-4 mr-2" }), "Stripe\u4FA1\u683C\u4E00\u89A7\u3092\u53D6\u5F97"] })) })] }), availablePrices.length > 0 && (_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u5229\u7528\u53EF\u80FD\u306A\u4FA1\u683CID" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid gap-2 max-h-60 overflow-y-auto", children: availablePrices.map((price) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-mono text-sm", children: price.id }), _jsxs("div", { className: "text-sm text-gray-600", children: [formatPrice(price.unit_amount, price.currency), price.recurring && ` / ${price.recurring.interval}`] })] }), _jsx("div", { className: "space-x-2", children: plans.map((plan) => (_jsx(Button, { size: "sm", variant: "outline", onClick: () => selectPriceId(plan.id, price.id), className: "text-xs", children: plan.name }, plan.id))) })] }, price.id))) }) })] })), _jsx("div", { className: "grid gap-6 md:grid-cols-2", children: plans.map((plan) => (_jsxs(Card, { className: "relative", children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-xl", children: plan.name }), _jsx(Badge, { variant: plan.verified ? "default" : "secondary", children: plan.verified ? "確認済み" : "未確認" })] }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: plan.displayPrice }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Stripe\u8A2D\u5B9A: ", plan.stripeAmount, " ", plan.currency.toUpperCase(), " (", plan.period, ")"] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "\u73FE\u5728\u306E\u4FA1\u683CID" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "font-mono text-sm bg-gray-100 px-3 py-2 rounded flex-1", children: plan.currentPriceId }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => copyToClipboard(plan.currentPriceId), children: _jsx(Copy, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "\u65B0\u3057\u3044\u4FA1\u683CID" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "price_1...", value: plan.newPriceId, onChange: (e) => updatePriceId(plan.id, e.target.value), className: "flex-1" }), _jsxs(Button, { size: "sm", onClick: () => verifyPriceId(plan.id, plan.newPriceId), disabled: !plan.newPriceId.trim(), children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "\u78BA\u8A8D"] })] })] }), plan.verificationResult && (_jsxs(Alert, { className: "border-green-200", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-green-700", children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "font-semibold", children: "\u78BA\u8A8D\u7D50\u679C:" }), _jsxs("div", { className: "text-sm", children: ["\u6599\u91D1: ", formatPrice(plan.verificationResult.unit_amount, plan.verificationResult.currency)] }), _jsxs("div", { className: "text-sm", children: ["\u30BF\u30A4\u30D7: ", plan.verificationResult.type] }), _jsxs("div", { className: "text-sm", children: ["\u30A2\u30AF\u30C6\u30A3\u30D6: ", plan.verificationResult.active ? 'Yes' : 'No'] })] }) })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "\u6A5F\u80FD" }), _jsx("div", { className: "space-y-1", children: plan.features.map((feature, idx) => (_jsxs("div", { className: "text-sm text-gray-600 flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-green-500" }), feature] }, idx))) })] }), _jsx("div", { className: "text-sm text-gray-500 p-3 bg-gray-50 rounded", children: plan.description })] })] }, plan.id))) }), _jsx("div", { className: "mt-8 text-center", children: _jsx(Button, { onClick: saveConfiguration, disabled: isUpdating || !plans.some(p => p.verified && p.newPriceId), className: "px-8 py-3 text-lg", children: isUpdating ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-5 h-5 mr-2 animate-spin" }), "\u4FDD\u5B58\u4E2D..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-5 h-5 mr-2" }), "\u8A2D\u5B9A\u3092\u4FDD\u5B58"] })) }) }), _jsxs("div", { className: "mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-800 mb-2", children: "\u8A2D\u5B9A\u624B\u9806" }), _jsxs("ol", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "1. \u5404\u30D7\u30E9\u30F3\u306E\u300C\u65B0\u3057\u3044\u4FA1\u683CID\u300D\u30D5\u30A3\u30FC\u30EB\u30C9\u306B\u6B63\u3057\u3044\u4FA1\u683CID\u3092\u5165\u529B" }), _jsx("li", { children: "2. \u300C\u78BA\u8A8D\u300D\u30DC\u30BF\u30F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u4FA1\u683CID\u306E\u6709\u52B9\u6027\u3092\u78BA\u8A8D" }), _jsx("li", { children: "3. \u5168\u30D7\u30E9\u30F3\u304C\u78BA\u8A8D\u6E08\u307F\u306B\u306A\u3063\u305F\u3089\u300C\u8A2D\u5B9A\u3092\u4FDD\u5B58\u300D\u3092\u30AF\u30EA\u30C3\u30AF" }), _jsx("li", { children: "4. \u4FDD\u5B58\u5F8C\u3001\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u9078\u629E\u30DA\u30FC\u30B8\u3067\u6B63\u3057\u3044\u4FA1\u683C\u304C\u8868\u793A\u3055\u308C\u307E\u3059" })] })] })] }) }));
}
