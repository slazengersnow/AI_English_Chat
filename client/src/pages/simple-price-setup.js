import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Save, RefreshCw, Copy, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function SimplePriceSetup() {
    const [currentMode, setCurrentMode] = useState('test');
    const [plans, setPlans] = useState([
        {
            id: 'standard_monthly',
            name: 'スタンダード月額',
            displayPrice: '¥980',
            description: '1日50問まで、基本練習機能',
            currentPriceId: 'price_1RjslTHridtc6DvMCNUU778G',
            newPriceId: 'price_1RjslTHridtc6DvMCNUU778G',
            verified: false
        },
        {
            id: 'standard_yearly',
            name: 'スタンダード年間',
            displayPrice: '¥9,800',
            description: '1日50問まで、基本練習機能（2ヶ月分お得）',
            currentPriceId: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
            newPriceId: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
            verified: false
        },
        {
            id: 'premium_monthly',
            name: 'プレミアム月額',
            displayPrice: '¥1,300',
            description: '1日100問まで、カスタムシナリオ・復習機能',
            currentPriceId: 'price_1RjslwHridtc6DvMshQinr44',
            newPriceId: 'price_1RjslwHridtc6DvMshQinr44',
            verified: false
        },
        {
            id: 'premium_yearly',
            name: 'プレミアム年間',
            displayPrice: '¥13,000',
            description: '1日100問まで、全機能（2ヶ月分お得）',
            currentPriceId: 'price_1Rjsn6Hridtc6DvMGQJaqBid',
            newPriceId: 'price_1Rjsn6Hridtc6DvMGQJaqBid',
            verified: false
        }
    ]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [availablePrices, setAvailablePrices] = useState([]);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const { toast } = useToast();
    // Price configurations for easy switching
    const testPrices = {
        standard_monthly: 'price_1RjslTHridtc6DvMCNUU778G',
        standard_yearly: 'price_1RjsmiHridtc6DvMWQXBcaJ1',
        premium_monthly: 'price_1RjslwHridtc6DvMshQinr44',
        premium_yearly: 'price_1Rjsn6Hridtc6DvMGQJaqBid'
    };
    const productionPrices = {
        standard_monthly: 'price_1ReXHSHridtc6DvMOjCbo2VK',
        standard_yearly: 'price_1ReXOGHridtc6DvM8L2KO7KO',
        premium_monthly: 'price_1ReXP9Hridtc6DvMpgawL58K',
        premium_yearly: 'price_1ReXPnHridtc6DvMQaW7NC6w'
    };
    // Load current configuration
    useEffect(() => {
        const loadCurrentConfig = async () => {
            try {
                const response = await fetch('/api/subscription-plans');
                const data = await response.json();
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: data[plan.id]?.priceId || '',
                    newPriceId: data[plan.id]?.priceId || ''
                })));
            }
            catch (error) {
                console.error('Failed to load current config:', error);
            }
        };
        loadCurrentConfig();
    }, []);
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
    const fetchAvailablePrices = async () => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch('/api/stripe/prices');
            const data = await response.json();
            if (response.ok) {
                setAvailablePrices(data.prices || []);
                toast({
                    title: "価格一覧取得完了",
                    description: `${data.prices?.length || 0}件の価格が取得されました`
                });
            }
            else {
                toast({
                    title: "エラー",
                    description: data.message || "価格一覧の取得に失敗しました",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch prices:', error);
            toast({
                title: "エラー",
                description: "価格一覧の取得に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsLoadingPrices(false);
        }
    };
    const assignPriceId = (planId, priceId) => {
        updatePriceId(planId, priceId);
        toast({
            title: "価格ID割り当て完了",
            description: `${priceId} を割り当てました`
        });
    };
    const switchMode = async (mode) => {
        setIsUpdating(true);
        try {
            const priceIds = mode === 'test' ? testPrices : productionPrices;
            const response = await fetch('/api/save-price-configuration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    ...priceIds
                })
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentMode(mode);
                // Update plans with new price IDs
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: priceIds[plan.id],
                    newPriceId: priceIds[plan.id]
                })));
                toast({
                    title: `${mode === 'test' ? 'テスト' : '本番'}モードに切り替えました`,
                    description: `${mode === 'test' ? '¥0のテスト価格' : '実際の料金'}で決済されます`,
                    duration: 3000,
                });
            }
            else {
                toast({
                    title: "切り替え失敗",
                    description: data.message,
                    variant: "destructive",
                    duration: 3000,
                });
            }
        }
        catch (error) {
            console.error('Mode switch error:', error);
            toast({
                title: "切り替え失敗",
                description: "モードの切り替え中にエラーが発生しました",
                variant: "destructive",
                duration: 3000,
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const saveConfiguration = async () => {
        setIsUpdating(true);
        try {
            const configData = plans.reduce((acc, plan) => {
                if (plan.newPriceId.trim()) {
                    acc[plan.id] = plan.newPriceId.trim();
                }
                return acc;
            }, {});
            const response = await fetch('/api/save-price-configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceIds: configData })
            });
            const result = await response.json();
            if (response.ok) {
                toast({
                    title: "設定保存完了",
                    description: "価格ID設定が保存されました。新しい設定でプラン選択ページが更新されます。"
                });
                // Update current price IDs
                setPlans(prev => prev.map(plan => ({
                    ...plan,
                    currentPriceId: plan.newPriceId || plan.currentPriceId
                })));
            }
            else {
                toast({
                    title: "保存エラー",
                    description: result.message || "設定の保存に失敗しました",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Save configuration error:', error);
            toast({
                title: "エラー",
                description: "設定の保存に失敗しました",
                variant: "destructive"
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\u4FA1\u683CID\u8A2D\u5B9A" }), _jsx("p", { className: "text-gray-600", children: "\u5404\u30D7\u30E9\u30F3\u306E\u4FA1\u683CID\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: "\u30E2\u30FC\u30C9\u5207\u308A\u66FF\u3048" }), _jsxs("div", { className: "flex items-center space-x-4 mb-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${currentMode === 'test' ? 'bg-green-500' : 'bg-gray-300'}` }), _jsx("span", { className: `text-sm font-medium ${currentMode === 'test' ? 'text-green-700' : 'text-gray-500'}`, children: "\u30C6\u30B9\u30C8\u30E2\u30FC\u30C9\uFF08\u00A50\uFF09" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${currentMode === 'production' ? 'bg-blue-500' : 'bg-gray-300'}` }), _jsx("span", { className: `text-sm font-medium ${currentMode === 'production' ? 'text-blue-700' : 'text-gray-500'}`, children: "\u672C\u756A\u30E2\u30FC\u30C9\uFF08\u5B9F\u969B\u306E\u6599\u91D1\uFF09" })] })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { onClick: () => switchMode('test'), disabled: isUpdating || currentMode === 'test', className: "bg-green-600 hover:bg-green-700 text-white", children: isUpdating ? 'switching...' : 'テストモードに切り替え' }), _jsx(Button, { onClick: () => switchMode('production'), disabled: isUpdating || currentMode === 'production', className: "bg-blue-600 hover:bg-blue-700 text-white", children: isUpdating ? 'switching...' : '本番モードに切り替え' })] })] }), _jsxs(Alert, { className: "mb-6", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsxs(AlertDescription, { children: [_jsx("strong", { children: "\u91CD\u8981:" }), " \u4FA1\u683CID\u306F\u300Cprice_\u300D\u3067\u59CB\u307E\u308BID\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u300Cprod_\u300D\u3067\u59CB\u307E\u308BProduct ID\u306F\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093\u3002"] })] }), _jsx("div", { className: "grid gap-6 mb-8", children: plans.map((plan) => (_jsxs(Card, { className: "border-2 hover:border-blue-200 transition-colors", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(DollarSign, { className: "h-5 w-5 text-green-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: plan.name }), _jsx("p", { className: "text-sm text-gray-600 font-normal", children: plan.description })] })] }), _jsx(Badge, { variant: "outline", className: "text-lg font-semibold", children: plan.displayPrice })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: `current-${plan.id}`, className: "text-sm font-medium", children: "\u73FE\u5728\u306E\u4FA1\u683CID" }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Input, { id: `current-${plan.id}`, value: plan.currentPriceId, readOnly: true, className: "bg-gray-50", placeholder: "\u672A\u8A2D\u5B9A" }), plan.currentPriceId && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => copyToClipboard(plan.currentPriceId), children: _jsx(Copy, { className: "h-4 w-4" }) }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: `new-${plan.id}`, className: "text-sm font-medium", children: "\u65B0\u3057\u3044\u4FA1\u683CID" }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Input, { id: `new-${plan.id}`, value: plan.newPriceId, onChange: (e) => updatePriceId(plan.id, e.target.value), placeholder: "price_xxxxxxxxxxxxxxxx", className: "flex-1" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => verifyPriceId(plan.id, plan.newPriceId), disabled: !plan.newPriceId.trim(), children: "\u78BA\u8A8D" })] })] })] }), plan.verified && plan.verificationResult && (_jsxs(Alert, { className: "bg-green-50 border-green-200", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }), _jsxs(AlertDescription, { className: "text-green-800", children: [_jsx("strong", { children: "\u78BA\u8A8D\u5B8C\u4E86:" }), " ", plan.verificationResult.unit_amount, " ", plan.verificationResult.currency.toUpperCase(), plan.verificationResult.recurring?.interval && ` / ${plan.verificationResult.recurring.interval}`] })] })), plan.newPriceId && !plan.verified && (_jsxs(Alert, { className: "bg-yellow-50 border-yellow-200", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-yellow-600" }), _jsx(AlertDescription, { className: "text-yellow-800", children: "\u4FA1\u683CID\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044" })] }))] })] }, plan.id))) }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center mb-8", children: [_jsx(Button, { onClick: fetchAvailablePrices, disabled: isLoadingPrices, variant: "outline", className: "w-full sm:w-auto", children: isLoadingPrices ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "\u53D6\u5F97\u4E2D..."] })) : (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Stripe\u4FA1\u683C\u4E00\u89A7\u3092\u53D6\u5F97"] })) }), _jsx(Button, { onClick: saveConfiguration, disabled: isUpdating || !plans.some(p => p.newPriceId.trim()), className: "w-full sm:w-auto", children: isUpdating ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "\u4FDD\u5B58\u4E2D..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "\u8A2D\u5B9A\u3092\u4FDD\u5B58"] })) })] }), availablePrices.length > 0 && (_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u5229\u7528\u53EF\u80FD\u306A\u4FA1\u683CID\u4E00\u89A7" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: availablePrices.map((price) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-mono text-sm", children: price.id }), _jsxs("div", { className: "text-sm text-gray-600", children: [price.unit_amount, " ", price.currency.toUpperCase(), price.recurring?.interval && ` / ${price.recurring.interval}`] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => copyToClipboard(price.id), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsxs("select", { className: "px-2 py-1 text-sm border rounded", onChange: (e) => e.target.value && assignPriceId(e.target.value, price.id), value: "", children: [_jsx("option", { value: "", children: "\u5272\u308A\u5F53\u3066" }), plans.map(plan => (_jsx("option", { value: plan.id, children: plan.name }, plan.id)))] })] })] }, price.id))) }) })] })), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["\u8A2D\u5B9A\u5B8C\u4E86\u5F8C\u3001", _jsx("a", { href: "/subscription-select", className: "text-blue-600 hover:underline mx-1", children: "\u30D7\u30E9\u30F3\u9078\u629E\u30DA\u30FC\u30B8" }), "\u3067\u65B0\u3057\u3044\u4FA1\u683C\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002"] }) })] }) }));
}
