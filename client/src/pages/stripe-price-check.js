import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function StripePriceCheck() {
    const [priceId, setPriceId] = useState('');
    const [priceInfo, setPriceInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const checkPrice = async () => {
        if (!priceId.trim()) {
            setError('価格IDを入力してください');
            return;
        }
        setLoading(true);
        setError(null);
        setPriceInfo(null);
        try {
            const response = await fetch('/api/stripe/price-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId: priceId.trim() })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch price info');
            }
            setPriceInfo(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    const formatPrice = (amount, currency) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount / 100);
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "コピーしました",
            description: "価格IDをクリップボードにコピーしました"
        });
    };
    // 推奨価格ID設定
    const recommendedPrices = [
        { name: "スタンダード月額", amount: 980, currency: "jpy" },
        { name: "スタンダード年額", amount: 9800, currency: "jpy" },
        { name: "プレミアム月額", amount: 1300, currency: "jpy" },
        { name: "プレミアム年額", amount: 13000, currency: "jpy" }
    ];
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-2xl", children: "Stripe\u4FA1\u683CID\u78BA\u8A8D\u30C4\u30FC\u30EB" }) }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "priceId", children: "\u4FA1\u683CID" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { id: "priceId", placeholder: "price_1ReXPnHridtc6DvMQaW7NC6w", value: priceId, onChange: (e) => setPriceId(e.target.value), className: "flex-1" }), _jsx(Button, { onClick: checkPrice, disabled: loading, children: loading ? "確認中..." : "確認" })] })] }), error && (_jsxs(Alert, { className: "border-red-200", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-red-700", children: error })] })), priceInfo && (_jsxs(Alert, { className: "border-green-200", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-green-700", children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "font-semibold", children: "\u4FA1\u683C\u60C5\u5831:" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: ["\u4FA1\u683CID: ", priceInfo.id] }), _jsxs("div", { children: ["\u6599\u91D1: ", formatPrice(priceInfo.unit_amount, priceInfo.currency)] }), _jsxs("div", { children: ["\u901A\u8CA8: ", priceInfo.currency.toUpperCase()] }), _jsxs("div", { children: ["\u30BF\u30A4\u30D7: ", priceInfo.type] }), _jsxs("div", { children: ["\u5546\u54C1ID: ", priceInfo.product] }), _jsxs("div", { children: ["\u30A2\u30AF\u30C6\u30A3\u30D6: ", priceInfo.active ? 'Yes' : 'No'] })] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => copyToClipboard(priceInfo.id), className: "mt-2", children: [_jsx(Copy, { className: "w-4 h-4 mr-2" }), "\u4FA1\u683CID\u3092\u30B3\u30D4\u30FC"] })] }) })] }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u63A8\u5968\u4FA1\u683C\u8A2D\u5B9A" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-4", children: "\u4EE5\u4E0B\u306E\u6599\u91D1\u3067Stripe\u306E\u4FA1\u683CID\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: recommendedPrices.map((price, index) => (_jsxs("div", { className: "p-4 border rounded-lg", children: [_jsx("div", { className: "font-semibold text-lg", children: price.name }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: formatPrice(price.amount, price.currency) }), _jsxs("div", { className: "text-sm text-gray-500 mt-2", children: ["Stripe\u8A2D\u5B9A: ", price.amount, " ", price.currency.toUpperCase()] })] }, index))) }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("div", { className: "font-semibold text-yellow-800 mb-2", children: "\u91CD\u8981\u306A\u6CE8\u610F\u4E8B\u9805:" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 \u65E5\u672C\u5186\u306E\u5834\u5408\u3001Stripe\u3067\u306F\u6700\u5C0F\u5358\u4F4D\uFF08\u5186\uFF09\u3067\u8A2D\u5B9A\u3057\u307E\u3059" }), _jsx("li", { children: "\u2022 \u00A51,300\u306E\u5834\u5408\u3001Stripe\u3067\u306F 1300 \u3068\u5165\u529B" }), _jsx("li", { children: "\u2022 \u00A513,000\u306E\u5834\u5408\u3001Stripe\u3067\u306F 13000 \u3068\u5165\u529B" }), _jsx("li", { children: "\u2022 \u4FA1\u683CID\u306F \"price_\" \u3067\u59CB\u307E\u308B\u6587\u5B57\u5217\u3067\u3059" }), _jsx("li", { children: "\u2022 \u5546\u54C1ID\u306F \"prod_\" \u3067\u59CB\u307E\u308B\u6587\u5B57\u5217\u3067\u3059" })] })] })] }) })] })] }) }));
}
